import { Role, Ticket, User } from '../types';

export const isAdmin = (user: User) => user.role === 'admin';
export const isPresident = (user: User) => user.role === 'president';
export const isWorker = (user: User) => user.role === 'worker';
export const isNeighbor = (user: User) => user.role === 'neighbor';

export function sameBuilding(user: User, buildingId?: string) {
  return Boolean(buildingId && user.buildingId === buildingId);
}

export function canManageCatalog(user: User) {
  return isAdmin(user);
}

export function canManageBuildings(user: User) {
  return isAdmin(user);
}

export function canPostAccounting(user: User) {
  return isAdmin(user);
}

export function canManageUsers(user: User) {
  return isAdmin(user);
}

export function canManagePayouts(user: User) {
  return isAdmin(user);
}

export function canResetFinances(user: User) {
  return isAdmin(user);
}

export function canDeleteTickets(user: User) {
  return isAdmin(user);
}

export function isTicketFinished(ticket?: Ticket) {
  return ticket?.status === 'resuelta' || ticket?.status === 'rechazada';
}

export function canDeleteFinishedTicket(user: User, ticket?: Ticket) {
  return isAdmin(user) && isTicketFinished(ticket);
}

export function canAssignWorkers(user: User) {
  return isAdmin(user);
}

export function canSetTicketPriority(user: User, ticket?: Ticket) {
  if (isAdmin(user)) return true;
  if (isPresident(user)) return ticket ? sameBuilding(user, ticket.buildingId) : true;
  return false;
}

export function canEditNeighborFees(actor: User, target?: User | null) {
  if (!isAdmin(actor)) return false;
  return Boolean(target);
}

export function canOpenBuilding(user: User, buildingId: string) {
  if (!buildingId) return false;
  if (isAdmin(user) || isWorker(user)) return true;
  if (isPresident(user) || isNeighbor(user)) return sameBuilding(user, buildingId);
  return false;
}

export function canViewBuildingAccounting(user: User, buildingId: string) {
  if (isAdmin(user)) return true;
  if (isPresident(user)) return sameBuilding(user, buildingId);
  return false;
}

export function canCreateTicket(user: User) {
  return user.role === 'admin' || user.role === 'president' || user.role === 'neighbor' || user.role === 'worker';
}

export function ticketBuildingForUser(user: User, requestedBuildingId: string) {
  if (isNeighbor(user) || isPresident(user)) {
    return user.buildingId || requestedBuildingId;
  }
  return requestedBuildingId;
}

export function canUpdateTicketStatus(user: User, ticket?: Ticket) {
  if (isAdmin(user)) return true;
  if (!isWorker(user) || !ticket) return false;
  return (
    !ticket.assignedWorkerId ||
    ticket.assignedWorkerId === user.id ||
    ticket.assignedWorkerName === user.name
  );
}

export function canChargeRepairFund(user: User, ticket?: Ticket) {
  return canUpdateTicketStatus(user, ticket);
}

export function canScheduleTicketVisit(user: User, ticket?: Ticket) {
  if (!ticket) return false;
  if (isAdmin(user)) return true;
  if (isPresident(user)) return sameBuilding(user, ticket.buildingId);
  if (isWorker(user)) {
    return (
      !ticket.assignedWorkerId ||
      ticket.assignedWorkerId === user.id ||
      ticket.assignedWorkerName === user.name
    );
  }
  return false;
}

export function canNotifyAdmin(user: User) {
  return isPresident(user) || isNeighbor(user);
}

export function canRequestSoferService(user: User) {
  return isNeighbor(user) || isPresident(user);
}

export function canManageSoferCatalog(user: User) {
  return isAdmin(user);
}

export function canOpenReports(user: User) {
  return isAdmin(user);
}

export function visibleRoles(_user: User): Role[] {
  return ['admin', 'president', 'worker', 'neighbor', 'unassigned'];
}
