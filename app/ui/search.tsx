'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
	const searchParams = useSearchParams(); // butuh dia utk get current URL (read-only)
	const pathname = usePathname(); // butuh dia utk get current pathname
	const { replace } = useRouter(); // butuh dia utk mengubah/mengupdate current URL yg aktif

	const handleSearch = useDebouncedCallback((term) => {
		console.log(`Searching... ${term}`);

		const params = new URLSearchParams(searchParams);
		params.set('page', '1'); // perlu utk mereset halaman ke halaman pertama disaat user malkukan pencarian. Kl nggak gitu, misal user lg d hal. 4 trus doing pencarian maka bisa jadi hal. 4 saat ini kosong krn banyaknya data yg didapat berdasarkan pencarian tadi tdk mencapai hal. 4
		if (term) {
			params.set('query', term);
		} else {
			params.delete('query');
		}
		replace(`${pathname}?${params.toString()}`);
	}, 300);

	return (
		<div className="relative flex flex-1 flex-shrink-0">
			<label htmlFor="search" className="sr-only">
				Search
			</label>
			<input
				className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
				placeholder={placeholder}
				onChange={(e) => handleSearch(e.target.value)}
				defaultValue={searchParams.get('query')?.toString()}
			/>
			<MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
		</div>
	);
}
