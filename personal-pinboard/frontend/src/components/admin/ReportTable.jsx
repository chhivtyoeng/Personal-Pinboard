import React, { useState } from 'react';
import { Table, Badge, Button, Text, Group, ActionIcon, Tooltip, Modal } from '@mantine/core';
import { IconCheck, IconX, IconEye, IconTrash, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { formatDate } from '../../utils/formatDate';
import { useSettings } from '../../context/SettingsContext';

export default function ReportTable({
  reports = [],
  onStatusUpdate,
  onDeleteReport,
  onDeleteReportedContent,
}) {
  const [inspectReport, setInspectReport] = useState(null);
  const { settings } = useSettings();
  const threshold = settings?.require_moderation_threshold || 3;
  const handleDelete = onDeleteReport || onDeleteReportedContent;

  const pinReportCounts = reports.reduce((acc, r) => {
    acc[r.pin_id] = (acc[r.pin_id] || 0) + 1;
    return acc;
  }, {});

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" variant="light" size="sm">Pending</Badge>;
      case 'reviewing':
        return <Badge color="blue" variant="light" size="sm">Reviewing</Badge>;
      case 'resolved':
        return <Badge color="green" variant="light" size="sm">Resolved</Badge>;
      case 'rejected':
      case 'dismissed':
        return <Badge color="gray" variant="light" size="sm">Rejected</Badge>;
      default:
        return <Badge color="gray" variant="light" size="sm">{status}</Badge>;
    }
  };

  return (
    <>
      {/* 1. Mobile Card List View (< md) */}
      <div className="md:hidden space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3"
          >
            {/* Top: Flagged Pin & Badges */}
            <div className="flex items-start gap-3">
              {report.pin_image && (
                <img
                  src={report.pin_image}
                  alt={report.pin_title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <Badge color="red" variant="dot" size="xs" className="font-semibold">
                    {report.reason}
                  </Badge>
                  {getStatusBadge(report.status)}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {report.pin_title || `Pin #${report.pin_id}`}
                  </p>
                  {pinReportCounts[report.pin_id] >= threshold && (
                    <Badge color="red" variant="filled" size="xs">
                      🚨 {pinReportCounts[report.pin_id]} Flags (Threshold Met)
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setInspectReport(report)}
                  className="text-[11px] text-brand-600 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1 mt-0.5"
                >
                  Inspect incident <IconEye size={12} />
                </button>
              </div>
            </div>

            {/* Middle: Reporter & Notes */}
            <div className="bg-slate-50/75 dark:bg-slate-800/40 rounded-xl p-2.5 text-xs space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500">
                <span>Reporter:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">@{report.reporter_username || 'Anonymous'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Reported:</span>
                <span>{formatDate(report.created_at)}</span>
              </div>
              {report.details && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800 line-clamp-2">
                  "{report.details}"
                </p>
              )}
            </div>

            {/* Bottom: Actions */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              {report.status !== 'resolved' ? (
                <button
                  type="button"
                  onClick={() => onStatusUpdate(report.id, 'resolved')}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                >
                  <IconCheck size={13} />
                  <span>Resolve</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed"
                >
                  Resolved
                </button>
              )}

              {report.status !== 'rejected' ? (
                <button
                  type="button"
                  onClick={() => onStatusUpdate(report.id, 'rejected')}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                >
                  <IconX size={13} />
                  <span>Reject</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed"
                >
                  Rejected
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete?.(report)}
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
              >
                <IconTrash size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover className="min-w-[760px]">
            <Table.Thead className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <Table.Tr>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Flagged Content</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Reporter</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Reason</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</Table.Th>
                <Table.Th className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Moderation Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reports.map((report) => (
                <Table.Tr key={report.id} className="border-b border-slate-100 dark:border-slate-800">
                  <Table.Td>
                    <div className="flex items-center gap-3">
                      {report.pin_image && (
                        <img
                          src={report.pin_image}
                          alt={report.pin_title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Text size="xs" fw={600} className="text-slate-900 dark:text-white line-clamp-1 max-w-[180px]">
                            {report.pin_title || `Pin #${report.pin_id}`}
                          </Text>
                          {pinReportCounts[report.pin_id] >= threshold && (
                            <Badge color="red" variant="filled" size="xs">
                              🚨 Threshold Met ({pinReportCounts[report.pin_id]})
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => setInspectReport(report)}
                          className="text-[11px] text-brand-600 hover:underline font-semibold cursor-pointer"
                        >
                          Inspect Details
                        </button>
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={500}>{report.reporter_username || 'Anonymous'}</Text>
                    <Text size="xs" c="dimmed">{report.reporter_email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="red" variant="dot" size="sm" className="font-semibold">
                      {report.reason}
                    </Badge>
                    {report.details && (
                      <Text size="xs" c="dimmed" className="line-clamp-1 max-w-[200px] mt-0.5">
                        {report.details}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {getStatusBadge(report.status)}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">{formatDate(report.created_at)}</Text>
                  </Table.Td>
                  <Table.Td align="right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Tooltip label="Open & Review" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          radius="xl"
                          onClick={() => setInspectReport(report)}
                        >
                          <IconEye size={15} />
                        </ActionIcon>
                      </Tooltip>

                      {report.status !== 'resolved' && (
                        <Button
                          size="xs"
                          variant="light"
                          color="green"
                          radius="xl"
                          leftSection={<IconCheck size={12} />}
                          onClick={() => onStatusUpdate(report.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      )}

                      {report.status !== 'rejected' && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="gray"
                          radius="xl"
                          leftSection={<IconX size={12} />}
                          onClick={() => onStatusUpdate(report.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      )}

                      <Tooltip label="Delete Safety Report" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          radius="xl"
                          onClick={() => handleDelete?.(report)}
                        >
                          <IconTrash size={15} />
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

      {/* Inspect Modal */}
      <Modal
        opened={!!inspectReport}
        onClose={() => setInspectReport(null)}
        title={<span className="font-bold text-slate-900 text-base">Report Incident Details</span>}
        radius="lg"
        centered
      >
        {inspectReport && (
          <div className="space-y-4">
            {inspectReport.pin_image && (
              <img
                src={inspectReport.pin_image}
                alt={inspectReport.pin_title}
                className="w-full h-48 object-cover rounded-2xl border border-slate-200"
              />
            )}

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pin Title</p>
              <h4 className="font-bold text-slate-900 text-sm">{inspectReport.pin_title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-[11px] font-bold text-slate-400">Reporter</p>
                <p className="text-xs font-semibold text-slate-800">@{inspectReport.reporter_username}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">Violation Reason</p>
                <Badge color="red" size="xs" variant="filled">{inspectReport.reason}</Badge>
              </div>
            </div>

            {inspectReport.details && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[11px] font-bold text-slate-400 mb-1">Reporter Notes</p>
                <p className="text-xs text-slate-700 leading-relaxed">{inspectReport.details}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="subtle"
                color="red"
                size="xs"
                radius="xl"
                onClick={() => {
                  const target = inspectReport;
                  setInspectReport(null);
                  handleDelete?.(target);
                }}
              >
                Delete Report
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="xs"
                  radius="xl"
                  onClick={() => {
                    onStatusUpdate(inspectReport.id, 'reviewing');
                    setInspectReport(null);
                  }}
                >
                  Mark Reviewing
                </Button>
                <Button
                  color="green"
                  size="xs"
                  radius="xl"
                  onClick={() => {
                    onStatusUpdate(inspectReport.id, 'resolved');
                    setInspectReport(null);
                  }}
                >
                  Resolve Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
