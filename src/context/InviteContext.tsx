import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CoordinatorInvite } from '../types';
import { useAuth } from './AuthContext';

interface InviteContextType {
  pendingInvites: CoordinatorInvite[];
  loadingInvites: boolean;
  respondToInvite: (inviteId: string, accept: boolean) => Promise<void>;
  sendInvite: (projectId: string, inviteeId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  refreshInvites: () => Promise<void>;
}

const InviteContext = createContext<InviteContextType | null>(null);

export const InviteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<CoordinatorInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!user) return;
    setLoadingInvites(true);
    const { data } = await supabase
      .from('coordinator_invites')
      .select(`
        id, project_id, invitee_id, invited_by, status, created_at,
        projects(title),
        profiles!coordinator_invites_invited_by_fkey(name)
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingInvites(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        projectId: r.project_id as string,
        projectTitle: ((r.projects as Record<string, unknown>)?.title ?? '') as string,
        inviteeId: r.invitee_id as string,
        invitedBy: r.invited_by as string,
        invitedByName: ((r.profiles as Record<string, unknown>)?.name ?? '') as string,
        status: r.status as CoordinatorInvite['status'],
        createdAt: r.created_at as string,
      }))
    );
    setLoadingInvites(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) { setPendingInvites([]); return; }
    fetchInvites();

    // Realtime subscription — new invite arrives while user is logged in
    const channel = supabase
      .channel('coordinator_invites')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coordinator_invites', filter: `invitee_id=eq.${user?.id}` },
        () => { fetchInvites(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, fetchInvites, user?.id]);

  const respondToInvite = useCallback(async (inviteId: string, accept: boolean) => {
    await supabase
      .from('coordinator_invites')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', inviteId);
    await fetchInvites();
  }, [fetchInvites]);

  const sendInvite = useCallback(async (projectId: string, inviteeId: string) => {
    await supabase.from('coordinator_invites').upsert(
      { project_id: projectId, invitee_id: inviteeId, invited_by: user?.id, status: 'pending' },
      { onConflict: 'project_id,invitee_id' }
    );
  }, [user]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    await supabase.from('coordinator_invites').delete().eq('id', inviteId);
  }, []);

  const refreshInvites = fetchInvites;

  return (
    <InviteContext.Provider value={{ pendingInvites, loadingInvites, respondToInvite, sendInvite, cancelInvite, refreshInvites }}>
      {children}
    </InviteContext.Provider>
  );
};

export const useInvites = (): InviteContextType => {
  const ctx = useContext(InviteContext);
  if (!ctx) throw new Error('useInvites must be used within InviteProvider');
  return ctx;
};
