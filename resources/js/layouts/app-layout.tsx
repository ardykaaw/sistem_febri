import TablerLayout from '@/layouts/tabler-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <TablerLayout breadcrumbs={breadcrumbs}>
            {children}
        </TablerLayout>
    );
}
