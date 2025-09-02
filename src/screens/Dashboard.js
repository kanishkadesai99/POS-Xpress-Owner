import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Dashboard({ route, navigation }) {
  const { hotelid, login_id, group_id = 0 } = route?.params || {};

  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkinData, setCheckinData] = useState([]);
  const [checkoutData, setCheckoutData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [hotelName, setHotelName] = useState('');
  const [lastBillTime, setLastBillTime] = useState('');
  const [hotelList, setHotelList] = useState([]);
  const [showHotelModal, setShowHotelModal] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [catsRes, occRes, cinRes, coutRes] = await Promise.all([
        fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_all_cats.php?hotelid=${hotelid}&login_id=${login_id}`),
        fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_all_occupancy.php?hotelid=${hotelid}`),
        fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_today_checkin.php?hotelid=${hotelid}`),
        fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_todaycheckout.php?hotel_id=${hotelid}`),
      ]);

      const [catsJson, occJson, cinJson, coutJson] = await Promise.all([
        catsRes.json(),
        occRes.json(),
        cinRes.json(),
        coutRes.json(),
      ]);

      const cats = catsJson.result || [];
      setDashboardData(cats);
      setOccupancyData(occJson.result || []);
      setCheckinData(cinJson.result || []);
      setCheckoutData(coutJson.result || []);

      if (cats.length > 0) {
        setHotelName(cats[0].hotelname || '');
        const billEntry = cats.find(item => item.datetime || item.BillDate);
        if (billEntry) setLastBillTime(billEntry.datetime || billEntry.BillDate);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load some data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hotelid || !login_id) {
      Alert.alert('Missing Info', 'Login info missing');
      return;
    }
    fetchAllData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userSession');
    navigation.replace('Login');
  };
  const groupDataBySection = () => {
    const grouped = {};
    dashboardData.forEach((item) => {
      if (!grouped[item.GrounpName]) grouped[item.GrounpName] = [];
      grouped[item.GrounpName].push(item);
    });
    return grouped;
  };

  const groupedData = groupDataBySection();

  const getSectionColor = (section) => {
    if (section === 'SALES REVENUE') return 'green';
    if (section === 'IN-OUT TODAY') return '#C58917';
    if (section === 'AMOUNT RECEIVED') return '#0070C0';
    if (section === 'ROOM STATUS') return '#0055A5';
    return '#333';
  };

  const formatInt = (val) => parseInt(val).toString();

  const renderMiniTable = (data, keys, headers) => (
    <View style={styles.sectionBox}>
      <View style={styles.rowHeader}>
        {headers.map((h, i) => (
          <Text key={i} style={styles.cellHeader}>{h}</Text>
        ))}
      </View>
      {data.map((item, idx) => (
        <View key={idx} style={[styles.row, { backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }]}>
          {keys.map((k, i) => (
            <Text key={i} style={styles.cell}>{item[k]}</Text>
          ))}
        </View>
      ))}
    </View>
  );

  const handleChangeHotel = async () => {
    try {
      const groupId = 1;
      const res = await fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_hotels_from_grp3.php?group_id=${groupId}`);
      const json = await res.json();
      setHotelList(json?.result || []);
      setShowHotelModal(true);
    } catch (e) {
      Alert.alert('Error', 'Could not load hotel list');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0055A5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.topBar}>
          <Image source={require('../Assets/Logo/title.png')} style={styles.logo} />
          <View style={styles.rightActions}>
            <TouchableOpacity onPress={fetchAllData}>
              <Text style={styles.refresh}><Text style={{ fontSize: 18 }}>⟳</Text> Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logout}>⎋ Logout</Text>
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.billHeader}>
          <View>
            <Text style={styles.billDate}>Last Bill Date:</Text>
            <Text style={styles.billDate}>{lastBillTime || 'N/A'}</Text>
          </View>
          <View style={styles.hotelRow}>
            <Text style={styles.hotelTitle}>{hotelName}</Text>
            {group_id !== 0 && (
              <TouchableOpacity style={styles.changeBtn} onPress={handleChangeHotel}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={[styles.sectionHeader, { color: getSectionColor('SALES REVENUE') }]}>SALES REVENUE</Text>
          <View style={styles.cardRowWrap}>
            {dashboardData
              .filter((item) => item.Categoryid === '11' || item.Categoryid === '30')
              .map((item, i) => (
                <View key={i} style={styles.cardRow}>
                  <Text style={styles.cardTitle}>{item.Categoryid === '11' ? 'Room' : 'Other'}</Text>
                  <Text style={styles.cardValue}>Today - {item.Value}</Text>
                </View>
              ))}
          </View>
        </View>

        {groupedData['IN-OUT TODAY'] && groupedData['AMOUNT RECEIVED'] && (
          <View style={styles.horizontalRow}>
            <View style={styles.halfCard}>
              <Text style={[styles.sectionHeader, { color: getSectionColor('IN-OUT TODAY') }]}>IN-OUT TODAY</Text>
              {groupedData['IN-OUT TODAY'].map((item, i) => (
                <Text key={i} style={styles.infoLine}>{item.CategoryName} - {formatInt(item.Value)}</Text>
              ))}
            </View>
            <View style={styles.halfCard}>
              <Text style={[styles.sectionHeader, { color: getSectionColor('AMOUNT RECEIVED') }]}>AMOUNT RECEIVED</Text>
              {groupedData['AMOUNT RECEIVED'].map((item, i) => (
                <Text key={i} style={styles.infoLine}>{item.CategoryName} - {item.Value}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionBox}>
          <Text style={[styles.sectionHeader, { backgroundColor: '#3FA9F5', color: '#fff' }]}>DAYBOOK REGISTER</Text>
          <View style={styles.daybookButtons}>
            <TouchableOpacity style={styles.daybookBtn} onPress={() => navigation.navigate('Today', { hotelid })}>
              <Text style={styles.daybookText}>TODAY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.daybookBtn} onPress={() => navigation.navigate('Yesterday', { hotelid, login_id })}>
              <Text style={styles.daybookText}>YESTERDAY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.daybookBtn} onPress={() => navigation.navigate('Monthly', { hotelid, login_id })}>
              <Text style={styles.daybookText}>MONTHLY</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.reservationBtn}
            onPress={() =>
              navigation.navigate('Reservation', {
                hotelid,
                login_id,
                group_id,
              })
            }
          >
            <Text style={styles.reservationText}>RESERVATION LIST</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionHeader, { backgroundColor: '#0070C0', color: '#fff' }]}>ROOM STATUS</Text>
          <View style={styles.statusRow}>
            {groupedData['ROOM STATUS']?.map((item, i) => (
              <Text key={i} style={styles.statusText}>{item.CategoryName} - {formatInt(item.Value)}</Text>
            ))}
          </View>

          <Text
            style={[
              styles.sectionHeader,
              { backgroundColor: '#0070C0', color: '#fff', marginTop: '10%' }
            ]}
          >
            OCCUPANCY REGISTER
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {renderMiniTable(
              occupancyData,
              ['RoomNo', 'RoomType', 'OTA', 'Guest'],
              ['Room #', 'Room Type', 'OTA', 'Guest']
            )}
          </ScrollView>

         {checkinData && checkinData.length > 0 && (
  <>
    <Text
      style={[
        styles.sectionHeader,
        { backgroundColor: '#0070C0', color: '#fff', marginTop: '10%' }
      ]}
    >
      TODAY'S CHECKIN
    </Text>

    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      {renderMiniTable(
        checkinData,
        ['RoomNo', 'RoomType', 'Guest', 'CheckInTime'],
        ['Room #', 'Room Type', 'Guest', 'Checkin Time']
      )}
    </ScrollView>
  </>
)}



        {checkoutData && checkoutData.length > 0 && (
  <>
    <Text
      style={[
        styles.sectionHeader,
        { backgroundColor: '#0070C0', color: '#fff', marginTop: '10%' }
      ]}
    >
      TODAY'S CHECKOUT
    </Text>

    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      {renderMiniTable(
        checkoutData,
        ['RoomNo', 'RoomType', 'GuestName', 'CheckOutTime'],
        ['Room #', 'Room Type', 'Guest', 'Checkout Time']
      )}
    </ScrollView>
  </>
)}

        </View>

        <View style={styles.footer}>
          <Image source={require('../Assets/Logo/down.jpg')} style={styles.footerImage} />
        </View>
      </ScrollView>
      <Modal visible={showHotelModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>Select Hotel</Text>
            {hotelList.map((hotel, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setShowHotelModal(false);
                  navigation.replace('Dashboard', {
                    hotelid: hotel.HotelId,
                    login_id,
                  });
                }}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: index !== hotelList.length - 1 ? 1 : 0,
                  borderColor: '#ccc',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 16, color: '#0070C0', fontWeight: 'bold' }}>{hotel.HotelName.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 30,
    resizeMode: 'contain',
  },
  refresh: {
    fontSize: 14,
    color: '#0055A5',
    marginRight: 18,
  },
  logout: { fontSize: 14, color: '#C0392B', fontWeight: 'bold' },
  menu: {
    fontSize: 18,
    color: '#333',
  },
  billHeader: {
    backgroundColor: '#0070C0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  billDate: {
    color: '#fff',
    fontSize: 16,
  },
  hotelTitle: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
  },
  hotelTitle: { fontWeight: 'bold', color: '#fff', fontSize: 18, marginTop: 4 },
  sectionBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, margin: 10, padding: 10 },
  sectionHeader: { textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  cardRowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardRow: { width: '48%', marginBottom: 12, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 6, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardValue: { fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  horizontalRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10, marginTop: 10 },
  halfCard: { width: '48%', backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  infoLine: { fontSize: 14, color: '#333', marginBottom: 4 },
  daybookButtons: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f5f5f5', paddingVertical: 10 },
  daybookBtn: { backgroundColor: '#F4C542', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  daybookText: { fontWeight: 'bold', color: '#333' },
  reservationBtn: { backgroundColor: '#2A9D8F', padding: 12, marginVertical: 10, borderRadius: 6, alignItems: 'center' },
  reservationText: { color: '#fff', fontWeight: 'bold' },
  roomStatusToggleBtn: { backgroundColor: '#0055A5', marginBottom: 10, borderRadius: 6, padding: 10, alignItems: 'center' },
  roomStatusToggleText: { color: '#fff', fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  statusText: { width: '48%', fontSize: 14, marginVertical: 4, color: '#333' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerImage: { width: '100%', height: 90 },
  rowHeader: { flexDirection: 'row', backgroundColor: '#e0e0e0', paddingVertical: 6 },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  cellHeader: { width: '25%', fontWeight: 'bold', textAlign: 'center' },
  cell: { width: '25%', textAlign: 'center', color: '#000' },
  hotelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  changeBtn: {
    marginLeft: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  changeText: {
    color: '#0070C0',
    fontWeight: 'bold',
    fontSize: 12,
  },

}); 