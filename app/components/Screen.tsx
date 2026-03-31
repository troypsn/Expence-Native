import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase';


function Screen(props: { userId: string | null, sortAscending: boolean, onFilterChange?: (filter: string) => void }) {
    const [selectedFilter, setSelectedFilter] = useState("TODAY");
    const [totalAmount, setTotalAmount] = useState(0);
    const filter = ["TODAY", " THIS WEEK", " THIS MONTH", "THIS YEAR", "ALL TIME"];

    const getDateRange = (filterType: string) => {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      let startDate = new Date(today);
      let endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);

      const filterTrimmed = filterType.trim();

      if (filterTrimmed === "THIS WEEK") {
        const dayOfWeek = today.getUTCDay();
        const diff = today.getUTCDate() - dayOfWeek;
        startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), diff, 0, 0, 0, 0));
        endDate = new Date(startDate);
        endDate.setUTCDate(endDate.getUTCDate() + 6);
        endDate.setUTCHours(23, 59, 59, 999);
      } else if (filterTrimmed === "THIS MONTH") {
        startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      } else if (filterTrimmed === "THIS YEAR") {
        startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
      }

      return { startDate, endDate };
    };

    const getTotalAmount = async (filterType: string = "TODAY") => {
      if (!props.userId) return 0;
      
      let query = supabase.from('transactions').select('amount').eq('user_id', props.userId);
      
      const filterTrimmed = filterType.trim();
      
      if (filterTrimmed !== "ALL TIME") {
        const { startDate, endDate } = getDateRange(filterType);
        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();
        
        query = query.gte('created_at', startDateStr).lte('created_at', endDateStr);
      }
      
      const {data, error} = await query;
      
      if (error) {
        console.log('Error fetching total amount:', error);
        return 0;
      }
      const total = data.reduce((sum, transaction) => sum + transaction.amount, 0);
      console.log('Total amount:', total);
      return total;
    };

    const handleScreenPress = async (currentFilter: string) => {
      const currentIndex = filter.indexOf(currentFilter);
      const nextIndex = (currentIndex + 1) % filter.length;
      const nextFilter = filter[nextIndex];

      console.log('Selected filter:', nextFilter);

      setSelectedFilter(nextFilter);
      if (props.onFilterChange) {
        props.onFilterChange(nextFilter);
      }
      const total = await getTotalAmount(nextFilter);
      setTotalAmount(Math.round(total));
    };

    useEffect(() => {
      const fetchTotalAmount = async () => {
        const total = await getTotalAmount(selectedFilter);
        setTotalAmount(Math.round(total));
      };
      fetchTotalAmount();
    }, [props.userId, selectedFilter, props.sortAscending]);
    
    useEffect(() => {
      console.log('Screen component mounted with props:', props);
    }, [props]);

  return (
        <Pressable onPress={() => handleScreenPress(selectedFilter)}>
          <View style={styles.container}>
              <Text style={styles.header}>TOTAL COST</Text>
              <Text style={styles.filter}>:{selectedFilter}</Text>
              <Text style={styles.amount}>${totalAmount}</Text>
          </View>
        </Pressable>
  )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#afadad28',

        width: 300,
        minWidth: 250,
        maxWidth: 300,

        height: '25%',
        minHeight: 150,
        maxHeight: 200,
        gap: '2%',
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
    }
});

export default Screen