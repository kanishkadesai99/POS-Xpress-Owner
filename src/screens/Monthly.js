import React, { useEffect, useState } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, Modal, Pressable, Platform, ActionSheetIOS,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function MonthlyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const hotelId = route.params?.hotelid ?? 0;      // <-- use real hotel id
  const login_id = route.params?.login_id ?? 0;    // optional for back nav

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(''); // keep as string
  const [modalVisible, setModalVisible] = useState(false);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch accounts
  useEffect(() => {
    if (!hotelId) return;
    fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_all_account.php?hotel_id=${hotelId}`)
      .then(res => res.json())
      .then(data => {
        const result = data?.result ?? [];
        setAccounts(result);

        const defaultAcc = result.find(
          a => String(a?.AccountName || '').trim().toUpperCase() === 'CASH COUNTER'
        );
        const firstId = defaultAcc?.AccountId ?? result[0]?.AccountId ?? '';
        setSelectedAccount(String(firstId));
      })
      .catch(e => console.warn('Account fetch failed:', e));
  }, [hotelId]);

  // Fetch MONTHLY data
  useEffect(() => {
    if (!selectedAccount || !hotelId) return;
    setLoading(true);

    const incomeURL = `https://rnsoftwares.com/XpressOwnerAndroid/get_income_monthly.php?hotel_id=${hotelId}&ac_id=${selectedAccount}`;
    const expenseURL = `https://rnsoftwares.com/XpressOwnerAndroid/get_exp_monthly.php?hotel_id=${hotelId}&ac_id=${selectedAccount}`;
    const summaryURL = `https://rnsoftwares.com/XpressOwnerAndroid/get_summary_monthly.php?hotel_id=${hotelId}&ac_id=${selectedAccount}`;

    Promise.allSettled([
      fetch(incomeURL).then(r => r.json()),
      fetch(expenseURL).then(r => r.json()),
      fetch(summaryURL).then(r => r.json()),
    ])
      .then(([incomeRes, expenseRes, summaryRes]) => {
        const income = incomeRes.status === 'fulfilled' ? (incomeRes.value?.result ?? []) : [];
        const expense = expenseRes.status === 'fulfilled' ? (expenseRes.value?.result ?? []) : [];
        const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value?.result?.[0] ?? null) : null;

        setIncomeData(income);
        setExpenseData(expense);
        setSummaryData(summary);
      })
      .catch(err => console.warn('Fetch error:', err))
      .finally(() => setLoading(false));
  }, [selectedAccount, hotelId]);

  const handleAccountSelect = () => {
    if (!accounts.length) return;

    if (Platform.OS === 'ios') {
      const options = accounts.map(a => String(a.AccountName));
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options, 'Cancel'], cancelButtonIndex: options.length },
        idx => {
          if (idx !== options.length) {
            const chosen = accounts[idx];
            setSelectedAccount(String(chosen.AccountId));
          }
        }
      );
    } else {
      setModalVisible(true);
    }
  };

  const calculateExpenseTotal = () =>
    expenseData.reduce((sum, item) => sum + parseFloat(item?.Amount || 0), 0).toFixed(2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View className="header" style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Dashboard', { hotelid: hotelId, login_id });
            }}
          >
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>MONTHLY DAYBOOK</Text>
        </View>

        {/* Account Selection */}
        <Text style={styles.label}>Select Account</Text>
        <TouchableOpacity style={styles.fakeInput} onPress={handleAccountSelect} disabled={!accounts.length}>
          <Text style={styles.fakeInputText}>
            {accounts.length === 0
              ? 'Loading...'
              : String(
                accounts.find(a => String(a.AccountId) === String(selectedAccount))?.AccountName ||
                'Select Account'
              )}
          </Text>
        </TouchableOpacity>

        {/* Android Modal Picker */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <View style={{ height: 200, marginBottom: 10 }}>
                <Picker
                  selectedValue={selectedAccount}
                  onValueChange={val => {
                    setSelectedAccount(String(val));
                    setModalVisible(false);
                  }}
                >
                  {accounts.map(acc => (
                    <Picker.Item
                      key={String(acc.AccountId)}
                      label={String(acc.AccountName)}
                      value={String(acc.AccountId)}
                    />
                  ))}
                </Picker>
              </View>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Loading / Content */}
        {loading ? (
          <ActivityIndicator size="large" color="#0070C0" />
        ) : (
          <>
            {/* INCOME */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>INCOME</Text>
              <View style={styles.rowHeader}>
                <Text style={styles.cellHeader}>Particular</Text>
                <Text style={styles.cellHeader}>Amount</Text>
              </View>
              {incomeData.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{String(item?.Particular || '')}</Text>
                  <Text style={styles.cell}>{String(item?.Income || '0')}</Text>
                </View>
              ))}
            </View>

            {/* EXPENSE */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>EXPENSE</Text>
              <View style={styles.rowHeader}>
                <Text style={styles.cellHeader}>Particular</Text>
                <Text style={styles.cellHeader}>Amount</Text>
                <Text style={styles.cellHeader}>Note</Text>
              </View>
              {expenseData.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{String(item?.Particular || '')}</Text>
                  <Text style={styles.cell}>{String(item?.Amount || '0')}</Text>
                  <Text style={styles.cell}>{String(item?.Note || '')}</Text>
                </View>
              ))}
              <View style={[styles.row, { backgroundColor: '#f0f0f0' }]}>
                <Text style={styles.cellBold}>Total</Text>
                <Text style={styles.cellBold}>{calculateExpenseTotal()}</Text>
                <Text style={styles.cell} />
              </View>
            </View>

            {/* SUMMARY (from get_summary_monthly.php) */}
            {summaryData && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>SUMMARY</Text>
                <View style={styles.rowHeader}>
                  <Text style={styles.cellHeader}>Particular</Text>
                  <Text style={styles.cellHeader}>Amount</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Opening Balance</Text>
                  <Text style={styles.cell}>{String(summaryData?.OpeningBalance || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Lodging Sale</Text>
                  <Text style={styles.cell}>{String(summaryData?.LodgingSale || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Total Income</Text>
                  <Text style={styles.cell}>{String(summaryData?.TotalIncome || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Expense Amount</Text>
                  <Text style={styles.cell}>{String(summaryData?.ExpenseAmount || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cellBold}>Closing Balance</Text>
                  <Text style={styles.cellBold}>{String(summaryData?.ClosingBalance || '0')}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backArrow: { fontSize: 26, color: '#0070C0', marginRight: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0070C0', textAlign: 'center', flex: 1 },
  label: { fontSize: 16, marginBottom: 6 },
  fakeInput: { borderWidth: 1, borderColor: '#999', borderRadius: 4, padding: 12, marginBottom: 20, justifyContent: 'center' },
  fakeInputText: { fontSize: 16, color: '#000' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#F5F5F5', width: '90%', borderRadius: 10, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  closeBtn: { marginTop: 10, backgroundColor: '#0070C0', padding: 10, alignItems: 'center', borderRadius: 6 },
  section: { marginBottom: 20, borderTopWidth: 1, borderColor: '#aaa', paddingTop: 10 },
  sectionHeader: { backgroundColor: '#89CFF0', textAlign: 'center', padding: 6, fontWeight: 'bold', marginBottom: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#e0e0e0', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#bbb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  cellHeader: { fontWeight: 'bold', width: '33%', paddingLeft: 6 },
  cell: { width: '33%', paddingLeft: 6 },
  cellBold: { width: '33%', fontWeight: 'bold', paddingLeft: 6 },
});
