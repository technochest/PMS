import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  Ticket,
  CreateTicketInput,
  TicketStatus,
  TicketPhase,
  Priority,
} from "./types";

interface TicketStore {
  // State
  tickets: Ticket[];
  selectedTicketId: string | null;
  nextTicketNumber: number;
  isLoading: boolean;
  error: string | null;

  // Ticket Actions
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (input: CreateTicketInput) => Ticket;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  selectTicket: (id: string | null) => void;
  
  // Bulk import
  importTickets: (tickets: CreateTicketInput[]) => Ticket[];
  
  // Filters
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  getTicketsByCategory: (category: string) => Ticket[];
  getTicketsByPriority: (priority: Priority) => Ticket[];
  getTicketsByAssignee: (assigneeId: string) => Ticket[];
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      tickets: [],
      selectedTicketId: null,
      nextTicketNumber: 46000, // Starting from a number after the existing tickets
      isLoading: false,
      error: null,

      setTickets: (tickets) => set({ tickets }),

      addTicket: (input) => {
        const ticket: Ticket = {
          id: uuidv4(),
          ticketNumber: get().nextTicketNumber,
          type: input.type || "task",
          title: input.title,
          summary: input.summary || null,
          rootCause: input.rootCause || null,
          emailSubject: input.emailSubject || null,
          emailConversation: input.emailConversation || null,
          emailFrom: input.emailFrom || null,
          emailTo: input.emailTo || null,
          emailCc: input.emailCc || null,
          source: input.source || "manual",
          dateRequested: input.dateRequested || new Date(),
          expectedEndDate: input.expectedEndDate || null,
          startDate: input.startDate || null,
          endDate: null,
          ventureName: input.ventureName || null,
          department: input.department || null,
          requestorName: input.requestorName || null,
          requestorEmail: input.requestorEmail || null,
          requestorManager: input.requestorManager || null,
          assignedToId: input.assignedToId || null,
          leadId: input.leadId || null,
          contractors: input.contractors || null,
          status: "open",
          priority: input.priority || "medium",
          queue: input.queue || 1,
          tracking: "on-track",
          phase: "not-started",
          percentComplete: 0,
          category: input.category || "Other",
          application: input.application || null,
          integration: input.integration || null,
          projectId: input.projectId || null,
          attachments: null,
          notes: input.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          tickets: [...state.tickets, ticket],
          nextTicketNumber: state.nextTicketNumber + 1,
        }));

        return ticket;
      },

      updateTicket: (id, updates) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? { ...ticket, ...updates, updatedAt: new Date() }
              : ticket
          ),
        }));
      },

      deleteTicket: (id) => {
        set((state) => ({
          tickets: state.tickets.filter((ticket) => ticket.id !== id),
          selectedTicketId:
            state.selectedTicketId === id ? null : state.selectedTicketId,
        }));
      },

      selectTicket: (id) => set({ selectedTicketId: id }),

      importTickets: (ticketInputs) => {
        const newTickets: Ticket[] = [];
        let currentNumber = get().nextTicketNumber;

        for (const input of ticketInputs) {
          const ticket: Ticket = {
            id: uuidv4(),
            ticketNumber: currentNumber++,
            type: input.type || "task",
            title: input.title,
            summary: input.summary || null,
            rootCause: input.rootCause || null,
            emailSubject: input.emailSubject || null,
            emailConversation: input.emailConversation || null,
            emailFrom: input.emailFrom || null,
            emailTo: input.emailTo || null,
            emailCc: input.emailCc || null,
            source: input.source || "email",
            dateRequested: input.dateRequested || new Date(),
            expectedEndDate: input.expectedEndDate || null,
            startDate: input.startDate || null,
            endDate: null,
            ventureName: input.ventureName || null,
            department: input.department || null,
            requestorName: input.requestorName || null,
            requestorEmail: input.requestorEmail || null,
            requestorManager: input.requestorManager || null,
            assignedToId: input.assignedToId || null,
            leadId: input.leadId || null,
            contractors: input.contractors || null,
            status: "open",
            priority: input.priority || "medium",
            queue: input.queue || 1,
            tracking: "on-track",
            phase: "not-started",
            percentComplete: 0,
            category: input.category || "Other",
            application: input.application || null,
            integration: input.integration || null,
            projectId: input.projectId || null,
            attachments: null,
            notes: input.notes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          newTickets.push(ticket);
        }

        set((state) => ({
          tickets: [...state.tickets, ...newTickets],
          nextTicketNumber: currentNumber,
        }));

        return newTickets;
      },

      getTicketsByStatus: (status) => {
        return get().tickets.filter((ticket) => ticket.status === status);
      },

      getTicketsByCategory: (category) => {
        return get().tickets.filter((ticket) => ticket.category === category);
      },

      getTicketsByPriority: (priority) => {
        return get().tickets.filter((ticket) => ticket.priority === priority);
      },

      getTicketsByAssignee: (assigneeId) => {
        return get().tickets.filter((ticket) => ticket.assignedToId === assigneeId);
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "ticket-storage",
    }
  )
);

export default useTicketStore;
