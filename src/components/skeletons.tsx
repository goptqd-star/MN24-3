import React from 'react';
import { View } from '../types';

const SkeletonLine: React.FC<{ width?: string, height?: string, className?: string }> = ({ width = 'w-full', height = 'h-4', className = '' }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${width} ${height} ${className}`}></div>
);

const BasePageSkeleton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
     <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        {children}
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-8">
        <div className="space-y-2">
            <SkeletonLine width="w-1/4" height="h-8" />
            <SkeletonLine width="w-1/2" height="h-5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonLine height="h-32" />
            <SkeletonLine height="h-32" />
        </div>
        <SkeletonLine height="h-48" />
    </div>
);

export const TableSkeleton: React.FC = () => (
    <BasePageSkeleton>
        <div className="space-y-8">
            <div>
                <SkeletonLine width="w-1/3" height="h-7" />
                <SkeletonLine width="w-1/2" className="mt-2" />
            </div>
            <div className="space-y-4">
                 <SkeletonLine height="h-10" />
                 <SkeletonLine height="h-10" />
                 <SkeletonLine height="h-10" />
                 <SkeletonLine height="h-10" />
                 <SkeletonLine height="h-10" />
            </div>
        </div>
    </BasePageSkeleton>
);

export const AnnouncementsSkeleton: React.FC = () => (
    <BasePageSkeleton>
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <SkeletonLine width="w-1/3" height="h-7" />
                 <SkeletonLine width="w-32" height="h-10" />
            </div>
            <div className="space-y-4">
                 <SkeletonLine height="h-24" />
                 <SkeletonLine height="h-24" />
                 <SkeletonLine height="h-24" />
            </div>
        </div>
    </BasePageSkeleton>
);


export const FormSkeleton: React.FC = () => (
    <BasePageSkeleton>
        <div className="space-y-6">
            <SkeletonLine width="w-1/4" height="h-8" />
            <div className="space-y-4">
                <SkeletonLine height="h-10" />
                <SkeletonLine height="h-20" />
                <SkeletonLine height="h-20" />
                 <SkeletonLine height="h-12" />
            </div>
        </div>
    </BasePageSkeleton>
);

export const ManagementSkeleton: React.FC = () => (
    <BasePageSkeleton>
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex space-x-6">
                    <SkeletonLine width="w-36" height="h-10" className="-mb-px" />
                    <SkeletonLine width="w-40" height="h-10" className="-mb-px" />
                </div>
            </div>
            <div className="space-y-6">
                <SkeletonLine height="h-28" />
                <SkeletonLine height="h-48" />
            </div>
        </div>
    </BasePageSkeleton>
);


export const SKELETONS: Record<string, React.ReactElement> = {
    [View.Dashboard]: <DashboardSkeleton />,
    [View.Register]: <FormSkeleton />,
    [View.Announcements]: <AnnouncementsSkeleton />,
    [View.Summary]: <TableSkeleton />,
    [View.List]: <TableSkeleton />,
    [View.Management]: <ManagementSkeleton />,
};