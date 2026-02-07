'use client';

import { useState, useMemo } from 'react';
import { Program } from '@/types/program';
import { programPath } from '@/lib/slugify';
import Link from 'next/link';

interface ProgramTableInteractiveProps {
  programs: Program[];
}

type SortKey = 'name' | 'universityName' | 'degreeType' | 'cost' | 'valueRating' | 'location';
type SortDir = 'asc' | 'desc';

const DEGREE_TYPES = [
  { key: 'masters', label: "Master's" },
  { key: 'phd', label: 'PhD' },
  { key: 'certificate', label: 'Certificate' },
  { key: 'bachelors', label: "Bachelor's" },
];

const COST_ORDER: Record<string, number> = { 'Free': 0, '$': 1, '$$': 2, '$$$': 3 };
const VALUE_ORDER: Record<string, number> = { 'excellent': 0, 'good': 1, 'fair': 2 };

function getCostDisplay(cost: string) {
  switch (cost) {
    case 'Free': return 'Free';
    case '$': return 'Low';
    case '$$': return 'Medium';
    case '$$$': return 'High';
    default: return cost;
  }
}

function getCostColor(cost: string) {
  switch (cost) {
    case 'Free': return 'text-green-700 dark:text-green-400';
    case '$': return 'text-blue-700 dark:text-blue-400';
    case '$$': return 'text-yellow-700 dark:text-yellow-400';
    case '$$$': return 'text-red-700 dark:text-red-400';
    default: return 'text-gray-700 dark:text-gray-400';
  }
}

function getValueColor(value: string) {
  switch (value) {
    case 'excellent': return 'text-green-700 dark:text-green-400';
    case 'good': return 'text-blue-700 dark:text-blue-400';
    case 'fair': return 'text-yellow-700 dark:text-yellow-400';
    default: return 'text-gray-700 dark:text-gray-400';
  }
}

function getValueLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getLocationDisplay(program: Program) {
  if (program.format === 'online') return 'Online';
  const parts = [program.city, program.state, program.country].filter(Boolean);
  if (program.format === 'hybrid') return parts.join(', ') + ' / Online';
  return parts.join(', ');
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function ProgramTableInteractive({ programs }: ProgramTableInteractiveProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set(DEGREE_TYPES.map(d => d.key)));
  const [showLocation, setShowLocation] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleType = (key: string) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = programs.filter(p => typeFilters.has(p.degreeType));
    if (onlineOnly) {
      result = result.filter(p => p.format === 'online' || p.format === 'hybrid');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.universityName.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.format === 'online' && 'online'.includes(q))
      );
    }
    setVisibleCount(PAGE_SIZE);
    return result;
  }, [programs, typeFilters, onlineOnly, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'cost':
          cmp = (COST_ORDER[a.cost] ?? 9) - (COST_ORDER[b.cost] ?? 9);
          break;
        case 'valueRating':
          cmp = (VALUE_ORDER[a.valueRating] ?? 9) - (VALUE_ORDER[b.valueRating] ?? 9);
          break;
        case 'location':
          cmp = getLocationDisplay(a).localeCompare(getLocationDisplay(b));
          break;
        default:
          cmp = (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const thClass = "px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search programs, universities, locations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Type filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type:</span>
          {DEGREE_TYPES.map(dt => (
            <button
              key={dt.key}
              onClick={() => toggleType(dt.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                typeFilters.has(dt.key)
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
              }`}
            >
              {dt.label}
            </button>
          ))}
          <button
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              onlineOnly
                ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
                : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Column toggles */}
      <div className="flex gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium uppercase">Columns:</span>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={showLocation} onChange={() => setShowLocation(!showLocation)} className="rounded" />
          Location
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={showValue} onChange={() => setShowValue(!showValue)} className="rounded" />
          Value
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
              <th className={thClass} onClick={() => toggleSort('name')}>
                Program <SortIcon active={sortKey === 'name'} dir={sortDir} />
              </th>
              <th className={`${thClass} hidden sm:table-cell`} onClick={() => toggleSort('universityName')}>
                University <SortIcon active={sortKey === 'universityName'} dir={sortDir} />
              </th>
              <th className={thClass} onClick={() => toggleSort('degreeType')}>
                Type <SortIcon active={sortKey === 'degreeType'} dir={sortDir} />
              </th>
              {showLocation && (
                <th className={`${thClass} hidden md:table-cell`} onClick={() => toggleSort('location')}>
                  Location <SortIcon active={sortKey === 'location'} dir={sortDir} />
                </th>
              )}
              <th className={thClass} onClick={() => toggleSort('cost')}>
                Cost <SortIcon active={sortKey === 'cost'} dir={sortDir} />
              </th>
              {showValue && (
                <th className={thClass} onClick={() => toggleSort('valueRating')}>
                  Value <SortIcon active={sortKey === 'valueRating'} dir={sortDir} />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No programs match your filters.
                </td>
              </tr>
            ) : visible.map((program) => (
              <tr key={program.id} className="bg-white dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={programPath(program.universityName, program.name)}
                    className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {program.name}
                  </Link>
                  <span className="sm:hidden block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {program.universityName}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                  {program.universityName}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap capitalize">
                  {program.degreeType === 'masters' ? "Master's" : program.degreeType === 'bachelors' ? "Bachelor's" : program.degreeType === 'phd' ? 'PhD' : 'Certificate'}
                </td>
                {showLocation && (
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                    {getLocationDisplay(program)}
                  </td>
                )}
                <td className={`px-4 py-3 font-medium whitespace-nowrap ${getCostColor(program.cost)}`}>
                  {getCostDisplay(program.cost)}
                </td>
                {showValue && (
                  <td className={`px-4 py-3 font-medium whitespace-nowrap ${getValueColor(program.valueRating)}`}>
                    {getValueLabel(program.valueRating)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Show more ({Math.min(PAGE_SIZE, sorted.length - visibleCount)} more)
          </button>
          <button
            onClick={() => setVisibleCount(sorted.length)}
            className="px-5 py-2 text-sm font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Show all {sorted.length}
          </button>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        Showing {visible.length} of {sorted.length} programs{sorted.length < programs.length ? ` (${programs.length} total)` : ''}. Click column headers to sort.
      </p>
    </div>
  );
}
