import LoginForm from './LoginForm';
import {presentationEnabled} from '@/lib/presentation';
export const dynamic='force-dynamic';
export default function LoginPage(){return <LoginForm demoEnabled={presentationEnabled()}/>;}
