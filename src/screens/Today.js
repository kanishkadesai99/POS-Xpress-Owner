import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function Today() {
  const navigation = useNavigation();
  const route = useRoute();
  const hotelId = route.params?.hotelid || 0;
  const login_id = route.params?.login_id || 0;

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`https://rnsoftwares.com/XpressOwnerAndroid/get_all_account.php?hotel_id=${hotelId}`)
      .then(res => res.json())
      .then(data => {
        const result = data.result || [];
        setAccounts(result);

        const defaultAccount = result.find(
          acc => acc.AccountName.trim().toUpperCase() === 'CASH COUNTER'
        );
        if (defaultAccount) {
          setSelectedAccount(String(defaultAccount.AccountId));
        } else if (result.length > 0) {
          setSelectedAccount(String(result[0].AccountId));
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;

    setLoading(true);

    const incomeURL = `https://rnsoftwares.com/XpressOwnerAndroid/get_income_today.php?hotel_id=${hotelId}&ac_id=${selectedAccount}`;
    const expenseURL = `https://rnsoftwares.com/XpressOwnerAndroid/get_exp_today.php?hotel_id=${hotelId}&ac_id=${selectedAccount}`;
    const summaryURL = `https://rnsoftwares.com/XpressOwnerAndroid/get_summary_today.php?hotel_id=${hotelId}&ac_id=${selectedAccount}`;

    Promise.all([
      fetch(incomeURL).then(res => res.json()),
      fetch(expenseURL).then(res => res.json()),
      fetch(summaryURL).then(res => res.json()),
    ])
      .then(([incomeRes, expenseRes, summaryRes]) => {
        setIncomeData(incomeRes.result || []);
        setExpenseData(expenseRes.result || []);
        setSummaryData(summaryRes.result?.[0] || null);
      })
      .catch(error => console.warn('Data fetch failed', error))
      .finally(() => setLoading(false));
  }, [selectedAccount]);

  const calculateExpenseTotal = () =>
    expenseData.reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0).toFixed(2);

  const handleAccountSelect = () => {
    if (accounts.length === 0) return;

    if (Platform.OS === 'ios') {
      const options = accounts.map(acc => acc.AccountName);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        buttonIndex => {
          if (buttonIndex !== options.length) {
            const selected = accounts[buttonIndex];
            setSelectedAccount(String(selected.AccountId));
          }
        }
      );
    } else {
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Dashboard', { hotelid: hotelId, login_id });
              }
            }}
          >
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>TODAY'S DAYBOOK</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <Text style={styles.label}>Select Account</Text>
        <TouchableOpacity
          style={[styles.fakeInput, accounts.length === 0 && { backgroundColor: '#eee' }]}
          onPress={handleAccountSelect}
          disabled={accounts.length === 0}
        >
          <Text style={styles.fakeInputText}>
            {accounts.length === 0
              ? 'Loading...'
              : String(
                  accounts.find(acc => String(acc.AccountId) === selectedAccount)?.AccountName ||
                    'Select Account'
                )}
          </Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <View style={{ height: 200, marginBottom: 10 }}>
                <Picker
                  selectedValue={selectedAccount}
                  onValueChange={(value) => {
                    setSelectedAccount(String(value));
                    setModalVisible(false);
                  }}
                >
                  {accounts.map(acc => (
                    <Picker.Item
                      key={acc.AccountId}
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

        {loading ? (
          <ActivityIndicator size="large" color="#0070C0" />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>INCOME</Text>
              <View style={styles.rowHeader}>
                <Text style={styles.cellHeader}>Particular</Text>
                <Text style={styles.cellHeader}>Amount</Text>
              </View>
              {incomeData.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{String(item.Particular || '')}</Text>
                  <Text style={styles.cell}>{String(item.Income || '0')}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>EXPENSE</Text>
              <View style={styles.rowHeader}>
                <Text style={styles.cellHeader}>Particular</Text>
                <Text style={styles.cellHeader}>Amount</Text>
                <Text style={styles.cellHeader}>Note</Text>
              </View>
              {expenseData.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cell}>{String(item.Particular || '')}</Text>
                  <Text style={styles.cell}>{String(item.Amount || '0')}</Text>
                  <Text style={styles.cell}>{String(item.Note || '')}</Text>
                </View>
              ))}
              <View style={[styles.row, { backgroundColor: '#f0f0f0' }]}>
                <Text style={styles.cellBold}>Total</Text>
                <Text style={styles.cellBold}>{calculateExpenseTotal()}</Text>
                <Text style={styles.cell}></Text>
              </View>
            </View>

            {summaryData && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>SUMMARY</Text>
                <View style={styles.rowHeader}>
                  <Text style={styles.cellHeader}>Particular</Text>
                  <Text style={styles.cellHeader}>Amount</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Opening Balance</Text>
                  <Text style={styles.cell}>{String(summaryData.OpeningBalance || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Lodging Sale</Text>
                  <Text style={styles.cell}>{String(summaryData.LodgingSale || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Total Income</Text>
                  <Text style={styles.cell}>{String(summaryData.TotalIncome || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cell}>Expense Amount</Text>
                  <Text style={styles.cell}>{String(summaryData.ExpenseAmount || '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.cellBold}>Closing Balance</Text>
                  <Text style={styles.cellBold}>{String(summaryData.ClosingBalance || '0')}</Text>
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
  container: { padding: 16, paddingBottom: 60 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  headerButton: { width: 40, alignItems: 'center' },
  backArrow: { fontSize: 26, marginRight: 22, color: '#0070C0' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0070C0' },
  label: { fontSize: 16, marginTop: 20, marginBottom: 6 },
  fakeInput: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  fakeInputText: { fontSize: 16, color: '#000' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 10,
    backgroundColor: '#0070C0',
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  section: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderColor: '#aaa',
    paddingTop: 10,
  },
  sectionHeader: {
    backgroundColor: '#89CFF0',
    textAlign: 'center',
    padding: 6,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#bbb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cellHeader: { fontWeight: 'bold', width: '33%', paddingLeft: 6 },
  cell: { width: '33%', paddingLeft: 6 },
  cellBold: { width: '33%', fontWeight: 'bold', paddingLeft: 6 },
});
