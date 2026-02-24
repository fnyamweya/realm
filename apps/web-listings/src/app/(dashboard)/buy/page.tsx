import { redirect } from 'next/navigation';

export default function BuyAliasPage() {
  redirect('/listings?intent=buy');
}
