import { redirect } from 'next/navigation';

export default function MapAliasPage() {
  redirect('/listings?view=map');
}
