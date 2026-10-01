'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Village {
  id: string;
  village: string;
}

export interface LocationPickerValue {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  villageId: string;
}

const EMPTY_VALUE: LocationPickerValue = {
  province: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
  villageId: '',
};

export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationPickerValue | null;
  onChange: (value: LocationPickerValue | null) => void;
}) {
  const current = value ?? EMPTY_VALUE;

  const provincesQuery = useQuery({
    queryKey: ['locations', 'provinces'],
    queryFn: async () => (await api.get<string[]>('/locations/provinces')).data,
    staleTime: Infinity,
  });

  const districtsQuery = useQuery({
    queryKey: ['locations', 'districts', current.province],
    queryFn: async () =>
      (await api.get<string[]>('/locations/districts', { params: { province: current.province } })).data,
    enabled: !!current.province,
    staleTime: Infinity,
  });

  const sectorsQuery = useQuery({
    queryKey: ['locations', 'sectors', current.province, current.district],
    queryFn: async () =>
      (
        await api.get<string[]>('/locations/sectors', {
          params: { province: current.province, district: current.district },
        })
      ).data,
    enabled: !!current.district,
    staleTime: Infinity,
  });

  const cellsQuery = useQuery({
    queryKey: ['locations', 'cells', current.province, current.district, current.sector],
    queryFn: async () =>
      (
        await api.get<string[]>('/locations/cells', {
          params: { province: current.province, district: current.district, sector: current.sector },
        })
      ).data,
    enabled: !!current.sector,
    staleTime: Infinity,
  });

  const villagesQuery = useQuery({
    queryKey: ['locations', 'villages', current.province, current.district, current.sector, current.cell],
    queryFn: async () =>
      (
        await api.get<Village[]>('/locations/villages', {
          params: {
            province: current.province,
            district: current.district,
            sector: current.sector,
            cell: current.cell,
          },
        })
      ).data,
    enabled: !!current.cell,
    staleTime: Infinity,
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Province</label>
        <LocationSelect
          options={(provincesQuery.data ?? []).map((item) => ({ value: item, label: item }))}
          value={current.province}
          loading={provincesQuery.isLoading && !provincesQuery.data}
          placeholder="Select province"
          onChange={(province) => onChange({ ...EMPTY_VALUE, province })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">District</label>
        <LocationSelect
          options={(districtsQuery.data ?? []).map((item) => ({ value: item, label: item }))}
          value={current.district}
          disabled={!current.province}
          loading={districtsQuery.isFetching && !districtsQuery.data}
          placeholder="Select district"
          onChange={(district) => onChange({ ...current, district, sector: '', cell: '', village: '', villageId: '' })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Sector</label>
        <LocationSelect
          options={(sectorsQuery.data ?? []).map((item) => ({ value: item, label: item }))}
          value={current.sector}
          disabled={!current.district}
          loading={sectorsQuery.isFetching && !sectorsQuery.data}
          placeholder="Select sector"
          onChange={(sector) => onChange({ ...current, sector, cell: '', village: '', villageId: '' })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cell</label>
        <LocationSelect
          options={(cellsQuery.data ?? []).map((item) => ({ value: item, label: item }))}
          value={current.cell}
          disabled={!current.sector}
          loading={cellsQuery.isFetching && !cellsQuery.data}
          placeholder="Select cell"
          onChange={(cell) => onChange({ ...current, cell, village: '', villageId: '' })}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-sm font-medium">Village</label>
        <LocationSelect
          options={(villagesQuery.data ?? []).map((v) => ({ value: v.id, label: v.village }))}
          value={current.villageId}
          disabled={!current.cell}
          loading={villagesQuery.isFetching && !villagesQuery.data}
          placeholder="Select village"
          onChange={(villageId) => {
            const village = villagesQuery.data?.find((v) => v.id === villageId);
            onChange({ ...current, villageId, village: village?.village ?? '' });
          }}
        />
      </div>
      {current.villageId && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 sm:col-span-2">
          <span className="font-semibold">Selected location:</span>{' '}
          {[current.province, current.district, current.sector, current.cell, current.village].join(' › ')}
        </div>
      )}
    </div>
  );
}

function LocationSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled || loading}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{loading ? 'Loading…' : placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
