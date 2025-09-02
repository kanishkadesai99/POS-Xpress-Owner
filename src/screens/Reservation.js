// screens/Reservation.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';

const BLUE = '#0070C0';
const WHITE = '#FFFFFF';
const BORDER = '#DADADA';
const LABEL = '#333';

// ⬇️ Slimmer column widths
const COLS = {
  bookingId: 110,   // ReferenceNo
  guestName: 200,   // CustomerName
  mobile: 150,      // CustomerMobile
  pax: 80,          // Pax
  ota: 100,         // OTA
  rooms: 95,        // NoOfRooms
  rate: 115,        // Rate
  bookingDate: 135, // BookingDate
  bookingAmt: 135,  // BookingAmount
  nights: 95,       // Nights
};
const TABLE_MIN_WIDTH = Object.values(COLS).reduce((a, b) => a + b, 0);
const FOOTER_WIDTH = COLS.bookingAmt + COLS.nights;

export default function Reservation({ route, navigation }) {
  const { hotelid } = route?.params || {};

  const toDDMMYYYY = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const today = new Date();
  const fortyFiveDaysAgo = new Date(today);
  fortyFiveDaysAgo.setDate(today.getDate() - 45);

  const [fromDate, setFromDate] = useState(toDDMMYYYY(fortyFiveDaysAgo));
  const [toDate, setToDate] = useState(toDDMMYYYY(today));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const fetchList = useCallback(async () => {
    if (!hotelid) {
      Alert.alert('Missing Info', 'hotel_id is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url =
        `https://rnsoftwares.com/XpressOwnerAndroid/get_reservation_list2.php` +
        `?hotel_id=${encodeURIComponent(hotelid)}` +
        `&from_date=${encodeURIComponent(fromDate)}` +
        `&to_date=${encodeURIComponent(toDate)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(Array.isArray(json?.result) ? json.result : []);
    } catch (e) {
      console.log('Reservation fetch error:', e);
      setError('Failed to load reservations.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [hotelid, fromDate, toDate]);

  useEffect(() => {
    navigation?.setOptions?.({ headerShown: false });
    fetchList();
  }, [fetchList, navigation]);

  const totalBookingAmount = useMemo(() => {
    const total = rows.reduce((sum, r) => sum + (parseFloat(r?.BookingAmount ?? '0') || 0), 0);
    return total.toFixed(2);
  }, [rows]);

  const keyExtractor = (item, idx) =>
    String(item?.ReferenceNo || item?.BookingId || idx);

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.rowItem,
        { minWidth: TABLE_MIN_WIDTH, backgroundColor: index % 2 ? '#fff' : '#F7FAFF' },
      ]}
    >
      <Text style={[styles.td, { width: COLS.bookingId }]} numberOfLines={1}>
        {item?.ReferenceNo || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.guestName }]} numberOfLines={1}>
        {item?.CustomerName || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.mobile }]} numberOfLines={1}>
        {item?.CustomerMobile || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.pax }]} numberOfLines={1}>
        {item?.Pax || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.ota }]} numberOfLines={1}>
        {item?.OTA || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.rooms }]} numberOfLines={1}>
        {item?.NoOfRooms || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.rate }]} numberOfLines={1}>
        {item?.Rate || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.bookingDate }]} numberOfLines={1}>
        {item?.BookingDate || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.bookingAmt }]} numberOfLines={1}>
        {item?.BookingAmount || '—'}
      </Text>
      <Text style={[styles.td, { width: COLS.nights }]} numberOfLines={1}>
        {item?.Nights || '—'}
      </Text>
    </View>
  );

  const ListEmpty = useMemo(
    () => (
      <View style={{ padding: 24 }}>
        <Text style={{ textAlign: 'center', color: '#555' }}>
          {error ? error : 'No data for selected dates.'}
        </Text>
      </View>
    ),
    [error]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: WHITE }}>
      {/* TOP BLUE BAR */}
      <View style={styles.rlTopBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.rlBackBtn}>
          <Text style={styles.rlBackIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.rlTitle}>RESERVATION LIST</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* DATE ROW + LOAD */}
      <View style={styles.rlFilterRow}>
        <View style={[styles.rlFieldBlock, { marginRight: 10 }]}>
          <Text style={styles.rlLabel}>Checkin From Date</Text>
          <TextInput
            placeholder="DD-MM-YYYY"
            placeholderTextColor="#7A7A7A"
            value={fromDate}
            onChangeText={setFromDate}
            style={styles.rlInput}
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.rlFieldBlock, { marginRight: 10 }]}>
          <Text style={styles.rlLabel}>Checkin To Date</Text>
          <TextInput
            placeholder="DD-MM-YYYY"
            placeholderTextColor="#7A7A7A"
            value={toDate}
            onChangeText={setToDate}
            style={styles.rlInput}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.rlLoadBtn} onPress={fetchList}>
          <Text style={styles.rlLoadText}>LOAD</Text>
        </TouchableOpacity>
      </View>

      {/* TABLE (header + rows) — horizontal scroll */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: TABLE_MIN_WIDTH }}>
          <View style={{ flex: 1 }}>
            {/* HEADER (centered) */}
            <View style={[styles.rlTableHeader, { minWidth: TABLE_MIN_WIDTH }]}>
              <Text style={[styles.rlTh, { width: COLS.bookingId }]}>Booking Id</Text>
              <Text style={[styles.rlTh, { width: COLS.guestName }]}>Guest Name</Text>
              <Text style={[styles.rlTh, { width: COLS.mobile }]}>Mobile</Text>
              <Text style={[styles.rlTh, { width: COLS.pax }]}>Pax</Text>
              <Text style={[styles.rlTh, { width: COLS.ota }]}>OTA</Text>
              <Text style={[styles.rlTh, { width: COLS.rooms }]}>Rooms</Text>
              <Text style={[styles.rlTh, { width: COLS.rate }]}>Tariff</Text>
              <Text style={[styles.rlTh, { width: COLS.bookingDate }]}>Booking Date</Text>
              <Text style={[styles.rlTh, { width: COLS.bookingAmt }]}>Booking Amt</Text>
              <Text style={[styles.rlTh, { width: COLS.nights }]}>Nights</Text>
            </View>

            {/* LIST */}
            <FlatList
              data={rows}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={ListEmpty}
              contentContainerStyle={{ paddingBottom: 14, minWidth: TABLE_MIN_WIDTH }}
            />

            {/* FOOTER (aligned under Booking Amt + Nights) */}
            <View style={[styles.tableFooter, { minWidth: TABLE_MIN_WIDTH }]}>
              <View style={{ width: TABLE_MIN_WIDTH - FOOTER_WIDTH }} />
              <View style={[styles.footerCell, { width: FOOTER_WIDTH }]}>
                <Text style={styles.totalLabel}>Total Booking Amount:</Text>
                <Text style={styles.totalValue}>{totalBookingAmount}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Top bar
  rlTopBar: {
    height: 42,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  rlBackBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  rlBackIcon: { color: WHITE, fontSize: 24, fontWeight: '600', marginTop: -2 },
  rlTitle: { color: WHITE, fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },

  // Filters
  rlFilterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: WHITE,
  },
  rlFieldBlock: { flex: 1 },
  rlLabel: { color: LABEL, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  rlInput: {
    height: 40,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rlLoadBtn: {
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: BLUE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  rlLoadText: { color: WHITE, fontWeight: '800', letterSpacing: 0.3 },

  // Table header (compact paddings)
  rlTableHeader: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  rlTh: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
    paddingVertical: 8,
    paddingHorizontal: 6,  // ⬅️ tighter
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5EAF0',
    textAlign: 'center',
  },

  // Rows (compact paddings)
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EEF6',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: WHITE,
  },
  td: {
    color: '#111',
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,  // ⬅️ tighter
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5EAF0',
    textAlign: 'center',
  },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },

  // Footer
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#DFE6EF',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  footerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BLUE,
    marginLeft: 5,
  },
});
