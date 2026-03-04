export type UserRole = "student" | "hostel_owner" | "admin";

export interface DBUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
}
