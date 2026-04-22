export type UserRole = "student" | "hostel_owner" | "super_admin";

export interface DBUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_active: boolean;
}

export interface Hostel {
    id: string;
    name: string;
    description: string | null;
    university: string | null;
    address: string | null;
    price_range: string | null;
    amenities: string[] | null;
    images: string[] | null;
    owner_id: string;
    status: "pending" | "approved" | "rejected";
    category?: string;
    rating?: number;
    reviews_count?: number;
    created_at: string;
    users?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface RoomType {
    id: string;
    hostel_id: string;
    name: string;
    price: number;
    capacity: number;
    available: number;
    description?: string | null;
    images?: string[] | null;
}

export interface Booking {
    id: string;
    student_id: string;
    hostel_id: string;
    room_type_id: string;
    phone_number?: string;
    course?: string;
    move_in_date?: string;
    duration?: string;
    next_of_kin?: string;
    sponsor?: string;
    origin?: string;
    medical_history?: string;
    special_requests?: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
}

export interface BookingCartItem {
    id: string;
    student_id: string;
    hostel_id: string;
    room_type_id: string;
    check_in_date?: string | null;
    duration_months: number;
    note?: string | null;
    created_at: string;
    updated_at: string;
}

export type BookingIntentStatus =
    | "draft"
    | "hold_created"
    | "completed"
    | "expired"
    | "cancelled";

export interface BookingIntent {
    id: string;
    student_id: string;
    status: BookingIntentStatus;
    expires_at: string;
    checkout_metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface BookingIntentItem {
    id: string;
    intent_id: string;
    hostel_id: string;
    room_type_id: string;
    quantity: 1;
    unit_price: number;
    currency: string;
    created_at: string;
}

export type InventoryHoldStatus = "active" | "released" | "consumed" | "expired";

export interface InventoryHold {
    id: string;
    intent_id: string;
    room_type_id: string;
    student_id: string;
    quantity: number;
    status: InventoryHoldStatus;
    expires_at: string;
    created_at: string;
    updated_at: string;
}
