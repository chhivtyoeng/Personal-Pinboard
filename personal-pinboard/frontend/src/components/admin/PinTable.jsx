import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Avatar, ActionIcon, Text, Tooltip, Badge } from '@mantine/core';
import { IconTrash, IconEye, IconExternalLink, IconEyeOff, IconEyeCheck } from '@tabler/icons-react';
import { formatDate } from '../../utils/formatDate';

export default function PinTable({ pins = [], onDeletePin, onToggleHidePin }) {
  if (!pins || pins.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-12 text-center">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Pins in Moderation Queue</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">There are currently no visual pins to display.</p>
      </div>
    );
  }

  return (
    <>
      {/* 1. Mobile Card List View (< md) */}
      <div className="md:hidden space-y-3">
        {pins.map((pin) => (
          <div
            key={pin.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-xs space-y-3"
          >
            {/* Top: Image + Title + Badges */}
            <div className="flex items-start gap-3">
              <img
                src={pin.image_url}
                alt={pin.title}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <Badge size="xs" color="gray" variant="light" className="truncate">
                    {pin.category_name || pin.category?.name || 'Uncategorized'}
                  </Badge>
                  {pin.is_hidden ? (
                    <Badge size="xs" color="orange" variant="filled">
                      Hidden
                    </Badge>
                  ) : pin.is_private ? (
                    <Badge size="xs" color="yellow" variant="light">
                      Secret
                    </Badge>
                  ) : (
                    <Badge size="xs" color="teal" variant="light">
                      Public
                    </Badge>
                  )}
                </div>
                <Text size="sm" fw={600} className="text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {pin.title}
                </Text>
                {pin.destination_url && (
                  <a
                    href={pin.destination_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brand-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                  >
                    Source link <IconExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            {/* Middle: Author & Stats Info */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar src={pin.author_avatar || pin.user?.avatar_url} radius="xl" size="xs" />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {pin.author_name || pin.user?.full_name || pin.username || pin.user?.username || 'Creator'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                <span>{pin.likes_count || 0} saves</span> · <span>{formatDate(pin.created_at)}</span>
              </div>
            </div>

            {/* Bottom: Mobile Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/pins/${pin.id}`}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 active:scale-95 transition-all text-center"
              >
                <IconEye size={14} />
                <span>View</span>
              </Link>

              {onToggleHidePin && (
                <button
                  type="button"
                  onClick={() => onToggleHidePin(pin)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                    pin.is_hidden
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                  }`}
                >
                  {pin.is_hidden ? <IconEyeCheck size={14} /> : <IconEyeOff size={14} />}
                  <span>{pin.is_hidden ? 'Restore' : 'Hide'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeletePin(pin)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                <IconTrash size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover className="min-w-[720px]">
            <Table.Thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <Table.Tr>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Pin</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Creator</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Category</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Stats</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pins.map((pin) => (
                <Table.Tr key={pin.id}>
                  <Table.Td className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={pin.image_url}
                        alt={pin.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                      />
                      <div>
                        <Text size="sm" fw={600} className="text-slate-900 dark:text-white line-clamp-1 max-w-[220px]">
                          {pin.title}
                        </Text>
                        {pin.destination_url && (
                          <a
                            href={pin.destination_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-brand-600 hover:underline inline-flex items-center gap-0.5"
                          >
                            Source link <IconExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Avatar src={pin.author_avatar || pin.user?.avatar_url} radius="xl" size="xs" />
                      <Text size="xs" fw={500}>{pin.author_name || pin.user?.full_name || pin.username || pin.user?.username || 'Creator'}</Text>
                    </div>
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    <Badge size="xs" color="gray" variant="light">
                      {pin.category_name || pin.category?.name || 'Uncategorized'}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    {pin.is_hidden ? (
                      <Badge size="xs" color="orange" variant="filled">
                        Hidden
                      </Badge>
                    ) : pin.is_private ? (
                      <Badge size="xs" color="yellow" variant="light">
                        Secret
                      </Badge>
                    ) : (
                      <Badge size="xs" color="teal" variant="light">
                        Public
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    <Text size="xs" className="text-slate-500 dark:text-slate-400 font-medium">
                      {pin.likes_count || 0} saves · {pin.views_count || 0} views
                    </Text>
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    <Text size="xs" c="dimmed">{formatDate(pin.created_at)}</Text>
                  </Table.Td>
                  <Table.Td align="right" className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip label="View Pin" withArrow>
                        <Link to={`/pins/${pin.id}`}>
                          <ActionIcon variant="subtle" color="gray" radius="xl">
                            <IconEye size={16} />
                          </ActionIcon>
                        </Link>
                      </Tooltip>
                      {onToggleHidePin && (
                        <Tooltip label={pin.is_hidden ? 'Restore Pin to Feed' : 'Hide Pin from Feed'} withArrow>
                          <ActionIcon
                            variant="subtle"
                            color={pin.is_hidden ? 'teal' : 'orange'}
                            radius="xl"
                            onClick={() => onToggleHidePin(pin)}
                          >
                            {pin.is_hidden ? <IconEyeCheck size={16} /> : <IconEyeOff size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Delete Pin" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          radius="xl"
                          onClick={() => onDeletePin(pin)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}
