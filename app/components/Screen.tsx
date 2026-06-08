import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getTotalAmount, getDateRange } from '@/lib/db';

type ScreenProps = {
  userId: string | null;
  isGuest: boolean;
  sortAscending: boolean;
  onFilterChange?: (filter: string) => void;
  refreshTrigger?: number;
};

const FILTERS = ['TODAY', ' THIS WEEK', ' THIS MONTH', 'THIS YEAR', 'ALL TIME'];

function Screen({ userId, isGuest, sortAscending, onFilterChange, refreshTrigger }: ScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('TODAY');
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchTotal = async (filterType: string) => {
    const total = await getTotalAmount(userId, isGuest, filterType);
    setTotalAmount(Math.round(total));
  };

  const handleScreenPress = async (currentFilter: string) => {
    const currentIndex = FILTERS.indexOf(currentFilter);
    const nextIndex = (currentIndex + 1) % FILTERS.length;
    const nextFilter = FILTERS[nextIndex];
    setSelectedFilter(nextFilter);
    if (onFilterChange) onFilterChange(nextFilter);
    await fetchTotal(nextFilter);
  };

  useEffect(() => {
    fetchTotal(selectedFilter);
  }, [userId, isGuest, selectedFilter, sortAscending, refreshTrigger]);

  return (
    <Pressable onPress={() => handleScreenPress(selectedFilter)}>
      <View style={styles.container}>
        <Text style={styles.header}>TOTAL COST</Text>
        <Text style={styles.filter}>:{selectedFilter}</Text>
        <Text style={styles.amount}>${totalAmount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#afadad28',
    width: 300,
    minWidth: 250,
    maxWidth: 300,
    height: '25%',
    minHeight: 150,
    maxHeight: 200,
    gap: 2,
  },
  header: {
    fontFamily: 'VCR-Mono',
    fontSize: 12,
    color: 'white',
    marginBottom: 5,
  },
  amount: {
    fontFamily: 'VCR-Mono',
    fontSize: 30,
    color: 'white',
    marginBottom: 15,
  },
  filter: {
    fontFamily: 'VCR-Mono',
    fontSize: 10,
    color: 'white',
  },
});

export default Screen;