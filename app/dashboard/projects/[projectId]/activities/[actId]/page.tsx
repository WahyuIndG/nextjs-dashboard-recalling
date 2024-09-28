import React from 'react';

type Props = {
	params: {
		projectId: string;
		actId: string;
	};
};

export default async function Page({ params }: Props) {
	// await fetch('http://localhost:8000/api/movies', { cache: 'no-store' });
	console.log(`Halaman Activity ${params.actId} dari Project ${params.projectId}`);
	return (
		<div>
			Halaman Activity {params.actId} dari Project {params.projectId}
		</div>
	);
}
