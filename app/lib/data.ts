import { sql } from '@vercel/postgres';
import {
	CustomerField,
	CustomersTableType,
	InvoiceForm,
	InvoicesTable,
	LatestInvoiceRaw,
	Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// export async function fetchRevenue() {
// 	try {
// 		// Artificially delay a response for demo purposes.
// 		// Don't do this in production :)

// 		console.log('Fetching Revenue data...');
// 		await new Promise((resolve) => setTimeout(resolve, 6000));
// 		console.log('Revenue completed after 6 seconds.');

// 		const data = await sql<Revenue>`SELECT * FROM revenue`;

// 		return data.rows;
// 	} catch (error) {
// 		console.error('Database Error:', error);
// 		throw new Error('Failed to fetch revenue data.');
// 	}
// }

export const fetchRevenue = cache(async () => {
	try {
		// Artificially delay a response for demo purposes.
		// Don't do this in production :)

		console.log('Fetching Revenue data...');
		await new Promise((resolve) => setTimeout(resolve, 6000));
		console.log('Revenue completed after 6 seconds.');

		const data = await sql<Revenue>`SELECT * FROM revenue`;

		return data.rows;
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch revenue data.');
	}
});

export async function fetchLatestInvoices() {
	try {
		const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

		const latestInvoices = data.rows.map((invoice) => ({
			...invoice,
			amount: formatCurrency(invoice.amount),
		}));

		// Artificially delay a response for demo purposes.
		console.log('Fetching Latest Invoices data...');
		await new Promise((resolve) => setTimeout(resolve, 2000));
		console.log('Latest Invoices completed after 2 seconds.');

		return latestInvoices;
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch the latest invoices.');
	}
}

export async function fetchCardData() {
	try {
		// You can probably combine these into a single SQL query
		// However, we are intentionally splitting them to demonstrate
		// how to initialize multiple queries in parallel with JS.
		const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
		const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
		const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

		const data = await Promise.all([
			invoiceCountPromise,
			customerCountPromise,
			invoiceStatusPromise,
		]);

		// Artificially delay a response for demo purposes.
		console.log('Fetching Card data...');
		await new Promise((resolve) => setTimeout(resolve, 4000));
		console.log('Card completed after 4 seconds.');

		const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
		const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
		const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
		const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

		return {
			numberOfCustomers,
			numberOfInvoices,
			totalPaidInvoices,
			totalPendingInvoices,
		};
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch card data.');
	}
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
	const offset = (currentPage - 1) * ITEMS_PER_PAGE;

	try {
		const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

		return invoices.rows;
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch invoices.');
	}
}

export async function fetchInvoicesPages(query: string) {
	try {
		const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

		// artifically delay
		console.log('fetching total pages');
		await createDelay(3000);
		console.log('fetch total pages complete after 3 seconds');

		const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
		return totalPages;
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch total number of invoices.');
	}
}

export const fetchInvoicesPagesWithCache = unstable_cache(
	async (query: string) => {
		try {
			const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

			// artifically delay
			console.log('fetching total pages');
			await createDelay(3000);
			console.log('fetch total pages complete after 3 seconds');

			const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
			return totalPages;
		} catch (error) {
			console.error('Database Error:', error);
			throw new Error('Failed to fetch total number of invoices.');
		}
	},
	['invoice-pages'],
	{ tags: ['i-p'] }
);

export async function fetchInvoiceById(id: string) {
	try {
		const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

		const invoice = data.rows.map((invoice) => ({
			...invoice,
			// Convert amount from cents to dollars
			amount: invoice.amount / 100,
		}));

		return invoice[0];
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch invoice.');
	}
}

export async function fetchCustomers() {
	try {
		const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

		const customers = data.rows;
		return customers;
	} catch (err) {
		console.error('Database Error:', err);
		throw new Error('Failed to fetch all customers.');
	}
}

export async function fetchFilteredCustomers(query: string) {
	try {
		const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

		const customers = data.rows.map((customer) => ({
			...customer,
			total_pending: formatCurrency(customer.total_pending),
			total_paid: formatCurrency(customer.total_paid),
		}));

		return customers;
	} catch (err) {
		console.error('Database Error:', err);
		throw new Error('Failed to fetch customer table.');
	}
}

// code di bawah ini percobaan pribadi (try difference waterfall vs parallel)

async function fetchPromiseRevenue() {
	console.log('Fetching revenue data...');

	await new Promise((resolve) => setTimeout(resolve, 6000));

	const data = sql<Revenue>`SELECT * FROM revenue`;

	console.log('Revenie completed after 6 seconds.');
	return data;
}

async function fetchPromiseInvoices() {
	console.log('Fetching latest invoices data...');
	await new Promise((resolve) => setTimeout(resolve, 2000));

	const data = sql<LatestInvoiceRaw>`
	SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
	FROM invoices
	JOIN customers ON invoices.customer_id = customers.id
	ORDER BY invoices.date DESC
	LIMIT 5`;

	console.log('Latest Invoice completed after 2 seconds.');

	return data;
}

async function fetchPromiseCard() {
	console.log('Fetching card data...');
	await new Promise((resolve) => setTimeout(resolve, 4000));

	const data = sql`SELECT
											(SELECT COUNT(*) FROM invoices) AS "invoice_count",
											(SELECT COUNT(*) FROM customers) AS "customer_count",
											(SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) FROM invoices) AS "paid",
											(SELECT SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) FROM invoices) AS "pending"`;

	console.log('Card completed after 4 seconds.');

	return data;
}

export async function fetchAllDashboardData() {
	try {
		const allData = await Promise.all([
			fetchPromiseRevenue(),
			fetchPromiseInvoices(),
			fetchPromiseCard(),
		]);

		const revenue = allData[0].rows;
		const latestInvoices = allData[1].rows.map((inv) => ({
			...inv,
			amount: formatCurrency(inv.amount),
		}));
		const cardData = {
			numberOfInvoices: allData[2].rows[0].invoice_count,
			numberOfCustomers: allData[2].rows[0].customer_count,
			totalPaidInvoices: formatCurrency(allData[2].rows[0].paid),
			totalPendingInvoices: formatCurrency(allData[2].rows[0].pending),
		};

		return {
			revenue,
			latestInvoices,
			cardData,
		};
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch all dashboard data.');
	}
}

async function createDelay(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}
