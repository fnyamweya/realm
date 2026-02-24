import { redirect } from 'next/navigation';

export default function RentAliasPage() {
  redirect('/listings?intent=rent');
}
