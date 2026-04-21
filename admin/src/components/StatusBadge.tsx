import React from 'react';

export const statusColors: Record<string, string> = {
    'Pending': 'bg-yellow-50 text-yellow-600 border-yellow-100',
    'Confirmed': 'bg-blue-50 text-blue-600 border-blue-100',
    'Packaged': 'bg-purple-50 text-purple-600 border-purple-100',
    'On Courier': 'bg-orange-50 text-orange-600 border-orange-100',
    'Delivered': 'bg-green-50 text-green-600 border-green-100',
    'Cancelled': 'bg-red-50 text-red-600 border-red-100',
    'Returned': 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase border rounded-full ${statusColors[status] || 'bg-gray-50'}`}>
            {status}
        </span>
    );
}