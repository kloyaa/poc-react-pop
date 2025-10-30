export interface RegisterPayload {
    email: string;
    username: string;
    password: string;
    phoneNumber?: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        address?: string;
        birthdate?: string;
    };
    registrationType?: string;
}
