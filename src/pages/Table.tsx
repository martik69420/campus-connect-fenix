
import React from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/context/LanguageContext';

// Example data type
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastActive: Date;
}

// Sample data
const users: User[] = [
  { 
    id: 1, 
    name: "John Doe", 
    email: "john@example.com", 
    role: "Admin", 
    status: "active", 
    lastActive: new Date('2023-09-15') 
  },
  { 
    id: 2, 
    name: "Jane Smith", 
    email: "jane@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-10-20') 
  },
  { 
    id: 3, 
    name: "Robert Johnson", 
    email: "robert@example.com", 
    role: "Editor", 
    status: "inactive", 
    lastActive: new Date('2023-08-05') 
  },
  { 
    id: 4, 
    name: "Emily Davis", 
    email: "emily@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-11-10') 
  },
  { 
    id: 5, 
    name: "Michael Brown", 
    email: "michael@example.com", 
    role: "Moderator", 
    status: "active", 
    lastActive: new Date('2023-11-25') 
  },
  { 
    id: 6, 
    name: "Sarah Wilson", 
    email: "sarah@example.com", 
    role: "User", 
    status: "inactive", 
    lastActive: new Date('2023-07-30') 
  },
  { 
    id: 7, 
    name: "David Miller", 
    email: "david@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-11-28') 
  },
  { 
    id: 8, 
    name: "Jennifer Garcia", 
    email: "jennifer@example.com", 
    role: "Editor", 
    status: "active", 
    lastActive: new Date('2023-10-15') 
  },
  { 
    id: 9, 
    name: "James Rodriguez", 
    email: "james@example.com", 
    role: "User", 
    status: "inactive", 
    lastActive: new Date('2023-06-20') 
  },
  { 
    id: 10, 
    name: "Patricia Martinez", 
    email: "patricia@example.com", 
    role: "Admin", 
    status: "active", 
    lastActive: new Date('2023-11-01') 
  },
  { 
    id: 11, 
    name: "Thomas Anderson", 
    email: "thomas@example.com", 
    role: "User", 
    status: "active", 
    lastActive: new Date('2023-10-10') 
  },
  { 
    id: 12, 
    name: "Linda Jackson", 
    email: "linda@example.com", 
    role: "Moderator", 
    status: "active", 
    lastActive: new Date('2023-09-22') 
  }
];

const TableDemo = () => {
  const { t } = useLanguage();
  
  // Define columns
  const columns: Column<User>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      sortable: true,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
    },
    {
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (user) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {user.status}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Last Active',
      accessorKey: 'lastActive',
      cell: (user) => user.lastActive.toLocaleDateString(),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Data Table Example</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <DataTable 
            data={users} 
            columns={columns} 
            searchable 
            searchField="name"
            pagination 
            pageSize={5}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default TableDemo;
