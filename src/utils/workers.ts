import { CustomRole, Ticket, User, WorkerPayout } from '../types';

export interface WorkerRosterEntry {
  id: string;
  name: string;
  specialty?: string;
  avatar?: string;
  email?: string;
  fromAccount: boolean;
}

function samePerson(aId?: string, aName?: string, bId?: string, bName?: string) {
  if (aId && bId && aId === bId) return true;
  const left = (aName || '').trim().toLowerCase();
  const right = (bName || '').trim().toLowerCase();
  return Boolean(left && right && left === right);
}

export function collectWorkerRoster(
  users: User[],
  payouts: WorkerPayout[],
  tickets: Ticket[],
  customRoles: CustomRole[] = []
): WorkerRosterEntry[] {
  const list: WorkerRosterEntry[] = [];
  const workerEmails = new Set(
    customRoles
      .filter((role) => role.baseRole === 'worker')
      .flatMap((role) => role.memberEmails.map((email) => email.trim().toLowerCase()))
  );

  const findIndex = (id?: string, name?: string) =>
    list.findIndex((w) => samePerson(w.id, w.name, id, name));

  const upsert = (entry: WorkerRosterEntry) => {
    const idx = findIndex(entry.id, entry.name);
    if (idx === -1) {
      list.push(entry);
      return;
    }
    list[idx] = {
      ...list[idx],
      ...entry,
      id: list[idx].fromAccount ? list[idx].id : entry.id || list[idx].id,
      fromAccount: list[idx].fromAccount || entry.fromAccount,
      specialty: list[idx].specialty || entry.specialty,
      avatar: list[idx].avatar || entry.avatar,
      email: list[idx].email || entry.email,
    };
  };

  users
    .filter(
      (u) =>
        u.status !== 'suspended' &&
        (u.role === 'worker' || workerEmails.has((u.email || '').trim().toLowerCase()))
    )
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
      specialty: t.assignedWorkerSpecialty,
      fromAccount: false,
    });
  });

  return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function countResolvedJobs(tickets: Ticket[], worker: { id?: string; name?: string }) {
  return tickets.filter(
    (t) =>
      t.status === 'resuelta' &&
      samePerson(t.assignedWorkerId, t.assignedWorkerName, worker.id, worker.name)
  ).length;
}
