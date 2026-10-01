'use client';

import { useQuery } from '@tanstack/react-query';
import { Combobox } from '@/components/ui/combobox';
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

  const toOptions = (values: string[] | undefined) => (values ?? []).map((v) => ({ value: v, label: v }));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Province</label>
        <Combobox
          options={toOptions(provincesQuery.data)}
          value={current.province || null}
          selectedLabel={current.province || undefined}
          loading={provincesQuery.isLoading && !provincesQuery.data}
          placeholder="Select province"
          searchPlaceholder="Search provinces…"
          onChange={(province) => onChange({ ...EMPTY_VALUE, province })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">District</label>
        <Combobox
          options={toOptions(districtsQuery.data)}
          value={current.district || null}
          selectedLabel={current.district || undefined}
          disabled={!current.province}
          loading={districtsQuery.isFetching && !districtsQuery.data}
          placeholder="Select district"
          searchPlaceholder="Search districts…"
          onChange={(district) => onChange({ ...current, district, sector: '', cell: '', village: '', villageId: '' })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Sector</label>
        <Combobox
          options={toOptions(sectorsQuery.data)}
          value={current.sector || null}
          selectedLabel={current.sector || undefined}
          disabled={!current.district}
          loading={sectorsQuery.isFetching && !sectorsQuery.data}
          placeholder="Select sector"
          searchPlaceholder="Search sectors…"
          onChange={(sector) => onChange({ ...current, sector, cell: '', village: '', villageId: '' })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cell</label>
        <Combobox
          options={toOptions(cellsQuery.data)}
          value={current.cell || null}
          selectedLabel={current.cell || undefined}
          disabled={!current.sector}
          loading={cellsQuery.isFetching && !cellsQuery.data}
          placeholder="Select cell"
          searchPlaceholder="Search cells…"
          onChange={(cell) => onChange({ ...current, cell, village: '', villageId: '' })}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-sm font-medium">Village</label>
        <Combobox
          options={(villagesQuery.data ?? []).map((v) => ({ value: v.id, label: v.village }))}
          value={current.villageId || null}
          selectedLabel={current.village || undefined}
          disabled={!current.cell}
          loading={villagesQuery.isFetching && !villagesQuery.data}
          placeholder="Select village"
          searchPlaceholder="Search villages…"
          onChange={(villageId) => {
            const village = villagesQuery.data?.find((v) => v.id === villageId);
            onChange({ ...current, villageId, village: village?.village ?? '' });
          }}
        />
      </div>
    </div>
  );
}
