import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'AFRIPAY AI — Intelligent Payments. Borderless Business.',description:'Invoice-to-payment intelligence and explainable transaction protection for African businesses. NEAR Hackathon 2026.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
