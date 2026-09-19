import { Ticket, User, WorkerPayout } from '../types';

export interface WorkerRosterEntry {
  id: string;
  name: string;
  specialty?: string;
  avatar?: string;
  email?: string;
  fromAccount: boolean;
}

export function collectWorkerRoster(
  users: User[],
  payouts: WorkerPayout[],
  tickets: Ticket[]
): WorkerRosterEntry[] {
  const list: WorkerRosterEntry[] = [];

  const findIndex = (id?: string, name?: string) =>
    list.findIndex(
      (w) =>
        (id && w.id === id) ||
        (name && w.name.trim().toLowerCase() === name.trim().toLowerCase())
    );

  const upsert = (entry: WorkerRosterEntry) => {
    const idx = findIndex(entry.id, entry.name);
    if (idx === -1) {
      list.push(entry);
      return;
    }
    list[idx] = {
      ...list[idx],
      ...entry,
      fromAccount: list[idx].fromAccount || entry.fromAccount,
      specialty: list[idx].specialty || entry.specialty,
      avatar: list[idx].avatar || entry.avatar,
      email: list[idx].email || entry.email,
    };
  };

  users
    .filter((u) => u.role === 'worker' && u.status !== 'suspended')
    .forEach((u) =>
      upsert({
        id: u.id,
        name: u.name,
        specialty: u.specialty,
        avatar: u.avatar,
        email: u.email,
        fromAccount: true,
      })
    );

  payouts.forEach((p) =>
    upsert({
      id: p.workerId || `payout-${p.workerName}`,
      name: p.workerName,
      specialty: p.workerSpecialty,
      fromAccount: false,
    })
  );

  tickets.forEach((t) => {
    if (!t.assignedWorkerId && !t.assignedWorkerName) return;
    upsert({
      id: t.assignedWorkerId || `ticket-${t.assignedWorkerName}`,
      name: t.assignedWorkerName || 'Operario',
      fromAccount: false,
    });
  });

  return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function countResolvedJobs(tickets: Ticket[], worker: { id?: string; name?: string }) {
  return tickets.filter(
    (t) =>
      t.status === 'resuelta' &&
      ((worker.id && t.assignedWorkerId === worker.id) ||
        (worker.name && t.assignedWorkerName === worker.name))
  ).length;
}
