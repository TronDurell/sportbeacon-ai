import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TipRecord } from '@/types/creator';

interface CreatorInvoiceTableProps {
  profileId: string;
}

export const CreatorInvoiceTable: React.FC<CreatorInvoiceTableProps> = ({
  profileId,
}) => {
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [totalTips, setTotalTips] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const tipsRef = collection(db, 'tips');
      let q = query(
        tipsRef,
        where('profileId', '==', profileId),
        orderBy(sortField, sortOrder as 'asc' | 'desc'),
        limit(rowsPerPage)
      );

      if (page > 0 && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const tipDocs = await getDocs(q);
      const tipData = tipDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipRecord[];
      
      setTips(tipData);
      setLastDoc(tipDocs.docs[tipDocs.docs.length - 1]);

      // Get total count
      const countSnapshot = await getDocs(
        query(tipsRef, where('profileId', '==', profileId))
      );
      setTotalTips(countSnapshot.size);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [profileId, page, rowsPerPage, sortField, sortOrder]);

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(0);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'stripe':
        return 'primary';
      case 'crypto':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && page === 0) {
    return <Skeleton variant="rectangular" height={400} />;
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'timestamp'}
                  direction={sortOrder as 'asc' | 'desc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'amount'}
                  direction={sortOrder as 'asc' | 'desc'}
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Method</TableCell>
              <TableCell>From</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tips.map((tip) => (
              <TableRow key={tip.id}>
                <TableCell>
                  {new Date(tip.timestamp).toLocaleDateString()}
                </TableCell>
                <TableCell>${tip.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={tip.method}
                    color={getMethodColor(tip.method)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{tip.fromName || 'Anonymous'}</TableCell>
                <TableCell>{tip.message || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalTips}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}; 