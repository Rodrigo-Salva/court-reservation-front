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
