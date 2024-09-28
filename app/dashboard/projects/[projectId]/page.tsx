import React from 'react';

type Props = {
	params: {
		projectId: string;
	};
};

export default async function Page({ params }: Props) {
	// await fetch('http://localhost:8000/api/movies', { cache: 'force-cache' });
	// console.log('project page is rendered');
	return <div>Halaman Project {params.projectId}</div>;
}
