import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { formatShortDateTime, truncate } from "../../lib/formatDisplay";

type Query = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
};

export function ExecutiveQueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadQueries() {
    setError("");
    try {
      const list = await api<Query[]>(apiPaths.executiveQueries);
      setQueries(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    loadQueries();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return queries;
    const q = search.toLowerCase();
    return queries.filter(
      (row) =>
        row.queryId.toLowerCase().includes(q) ||
        row.customerUsername.toLowerCase().includes(q) ||
        row.customerPhoneNumber.includes(q) ||
        (row.customerEmail ?? "").toLowerCase().includes(q) ||
        (row.remarks ?? "").toLowerCase().includes(q),
    );
  }, [queries, search]);

  return (
    <div className="data-board">
      <div className="data-board__toolbar">
        <div className="data-board__search-wrap">
          <span className="data-board__search-icon">
            <DataBoardSearchIcon />
          </span>
          <input
            className="data-board__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries, customer, phone…"
            aria-label="Search queries"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <Link to="/executive/queries/new" className="btn btn--primary btn--sm">
            New query
          </Link>
          <button type="button" className="btn btn--secondary btn--sm" onClick={loadQueries}>
            Refresh
          </button>
        </div>
      </div>
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Query</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Remarks</th>
              <th>Created</th>
              <th>Updated</th>
              <th className="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.queryId}>
                <td className="td-mono td-order-id">{q.queryId}</td>
                <td className="td-strong">{q.customerUsername}</td>
                <td>{q.customerPhoneNumber}</td>
                <td className="remark-clip" title={q.customerEmail || undefined}>
                  {q.customerEmail?.trim() ? q.customerEmail : "—"}
                </td>
                <td className="remark-clip" title={q.remarks || undefined}>
                  {truncate(q.remarks || "—", 48)}
                </td>
                <td className="date-cell">{formatShortDateTime(q.createdAt)}</td>
                <td className="date-cell">{formatShortDateTime(q.updatedAt)}</td>
                <td className="td-actions">
                  <div className="inline-actions">
                    <Link className="small-btn" to={`/executive/queries/${encodeURIComponent(q.queryId)}/remarks`}>
                      Remarks
                    </Link>
                    <Link className="btn btn--primary btn--sm" to={`/executive/orders/new/${encodeURIComponent(q.queryId)}`}>
                      Confirm order
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={8}>{queries.length === 0 ? "No queries yet. Create one with New query." : "No rows match your search."}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> quer{filtered.length === 1 ? "y" : "ies"}
            {search.trim() ? ` (of ${queries.length})` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
