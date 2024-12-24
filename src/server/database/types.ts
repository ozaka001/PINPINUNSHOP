export interface User {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    // Add any other user properties you need
}
