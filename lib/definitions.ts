// Tipos y constantes espejo de los DTOs / enums de court-reservation-api.
// Mantener sincronizado con:
// - dto/request/{AuthRequestDTO,UserRequestDTO}.java
// - dto/response/AuthResponseDTO.java
// - enums/MembershipType.java

export const MEMBERSHIP_TYPES = [
  { value: "NINGUNA", label: "Sin membresía" },
  { value: "BASICA", label: "Básica" },
  { value: "PREMIUN", label: "Premium" },
  { value: "VIP", label: "VIP" },
] as const;

export type MembershipType = (typeof MEMBERSHIP_TYPES)[number]["value"];

export const SPORT_TYPES = [
  { value: "FULBOL", label: "Fútbol" },
  { value: "TENIS", label: "Tenis" },
  { value: "BASQUET", label: "Básquet" },
  { value: "VOLEY", label: "Vóley" },
  { value: "PADEL", label: "Pádel" },
  { value: "SQUASH", label: "Squash" },
  { value: "BADMINTON", label: "Bádminton" },
  { value: "FRONTENIS", label: "Frontenis" },
] as const;

export type SportType = (typeof SPORT_TYPES)[number]["value"];

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
  NO_SHOW: "No show",
};

export type AuthResponseDTO = {
  token: string;
  name: string;
  role: string;
};

export type UserResponseDTO = {
  id: number;
  name: string;
  email: string;
  phone: string;
  membershipType: MembershipType;
  registrationDate: string;
  active: boolean;
  membershipDiscount: number;
  maxDaysAdvance: number;
};

export type ProfileFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      success?: boolean;
    }
  | undefined;

export type CourtResponseDTO = {
  id: number;
  name: string;
  sportType: SportType;
  capacity: number;
  basePricePerHour: number;
  active: boolean;
  description?: string;
  venueId?: number | null;
  venueName?: string | null;
};

export type CourtReviewResponseDTO = {
  id: number;
  courtId: number;
  courtName?: string;
  venueName?: string | null;
  hidden?: boolean;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type BookingResponseDTO = {
  id: number;
  userId: number;
  courtId: number;
  userName: string;
  courtName: string;
  bookingDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: string;
  totalPrice: number;
  isRecurrent: boolean;
  usesPackage: boolean;
  paymentDeadline?: string | null;
};

export type OperationalReportResponseDTO = {
  startDate: string;
  endDate: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShows: number;
  revenue: number;
  cancellationRate: number;
  peakHours: { hour: string; bookings: number }[];
  scope: string;
  daily: { date: string; bookings: number; revenue: number }[];
  byCourt: { courtId: number; courtName: string; sportType: string; venueName: string | null; bookings: number; revenue: number }[];
  bySport: { sportType: string; bookings: number; revenue: number }[];
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PaymentPageResponse = PageResponse<PaymentResponseDTO> & { approvedTotal: number; refundedTotal: number };

export type PaymentResponseDTO = {
  id: number;
  bookingId: number;
  courtName: string;
  amount: number;
  method: "TARJETA" | "YAPE_PLIN" | "EFECTIVO";
  status: "APROBADO" | "RECHAZADO" | "REEMBOLSADO";
  operationCode: string;
  rejectionReason?: string;
  paidAt?: string;
  refundedAt?: string;
  userName?: string;
  createdAt?: string;
};

export type UserNotificationResponseDTO = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type CourtBlockResponseDTO = {
  id: number;
  courtId: number;
  blockDate: string;
  startTime: string;
  endTime: string;
  type: "MANTENIMIENTO" | "FERIADO" | "EVENTO";
  reason: string;
  active: boolean;
};

export type VenueResponseDTO = { id: number; name: string; address: string; phone?: string; active: boolean };
export type TeamResponseDTO = { id: number; name: string; description?: string; ownerId: number; ownerName: string; memberCount: number };
export type TeamMemberDTO = { userId: number; name: string; role: "OWNER" | "MEMBER" };
export type TeamInvitationDTO = {
  id: number;
  teamId: number;
  teamName: string;
  invitedName: string;
  invitedEmail: string;
  invitedByName: string;
  status: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "CANCELADA";
  createdAt: string;
};

export type OpenMatchResponseDTO = {
  id: number;
  bookingId: number;
  courtId: number;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  creatorName: string;
  maxPlayers: number;
  confirmedPlayers: number;
  note?: string;
  status: "ABIERTO" | "COMPLETO" | "CERRADO";
};

export type OpenMatchJoinRequestDTO = {
  id: number;
  userId: number;
  name: string;
  status: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
};

export type TournamentMatchDTO = {
  id: number;
  playerOneId: number;
  playerOne: string;
  playerTwoId: number;
  playerTwo: string;
  scoreOne: number | null;
  scoreTwo: number | null;
  completed: boolean;
};

export type TournamentRankingDTO = {
  userId: number;
  name: string;
  points: number;
  wins: number;
  losses: number;
};

export type TournamentDTO = {
  id: number;
  name: string;
  sportType: SportType;
  startDate: string;
  maxParticipants: number;
  status: "INSCRIPCION" | "EN_CURSO" | "FINALIZADO";
  venueId?: number | null;
  venueName?: string | null;
};

export type TimeSlotDTO = {
  startTime: string;
  endTime: string;
  estimatedPrice?: number;
  priceFactor?: number;
};

export type CourtAvailabilityResponseDTO = {
  courtId: number;
  courtName: string;
  date: string;
  availableSlots: TimeSlotDTO[];
  occupiedSlots: TimeSlotDTO[];
};

export type RecurrentBookingResponseDTO = {
  totalRequested: number;
  successfulBookings: number;
  failedBookings: number;
  estimatedTotalPrice: number;
  recurrentDiscountApplied: boolean;
};

export type PackageResponseDTO = {
  id: number;
  name: string;
  hoursQuantity: number;
  price: number;
  discountPercentage: number;
  validityDays: number;
  active: boolean;
  pricePerHour: number;
  savings: number;
};

export type UserPackageResponseDTO = {
  id: number;
  userId: number;
  userName: string;
  packageId: number;
  packageName: string;
  initialHours: number;
  remainingHours: number;
  usedHours: number;
  purchaseDate: string;
  expirationDate: string;
  daysUntilExpiration: number;
  active: boolean;
  isExpired: boolean;
};

export type WaitingListResponseDTO = {
  id: number;
  userId: number;
  userName: string;
  courtId: number;
  courtName: string;
  desiredDate: string;
  desiredStartTime: string;
  desiredEndTime: string;
  requestDate: string;
  notified: boolean;
  notificationDate?: string;
  notificationExpirationDate?: string;
  positionInQueue: number;
};

export type BookingFormState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

export type LoginFormState =
  | {
      error?: string;
    }
  | undefined;

export type RegisterFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      values?: {
        name: string;
        email: string;
        phone: string;
        membershipType: string;
      };
    }
  | undefined;
