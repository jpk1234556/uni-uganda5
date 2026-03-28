export type UserRole = "student" | "hostel_owner" | "super_admin";

export interface DBUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_active: boolean;
    phone_number?: string;
    course?: string;
    next_of_kin?: string;
    medical_history?: string;
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
