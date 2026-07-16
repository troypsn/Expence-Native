import { View, Text, StyleSheet, Pressable, ScrollView, StatusBar} from 'react-native';
import Background from '../components/Background';

const About = () => {
  return (
    <Background>
      <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
      <ScrollView>
        
        
          <View style={styles.container}>
            <View style={styles.textContainer}>
              <Text style={styles.header}>About Expence.</Text>
              <Text style={styles.subText}>
                Before Expence, I used a few of the well-known budgeting apps. Each one asked for the same thing before I could log a single expense. set up income sources, pick a budgeting method, create categories, connect a bank account. Some of it took a decade to setup. None of it was the reason I opened the app. 
              </Text>

              <Text style={styles.subText}>
                What I actually wanted was smaller: a place to write down that I'd spent money, 
                and a way to see how much added up over a week or a month
              </Text>

              <Text style={styles.subText}>
                The forecasting, the subscription tracking, the AI-generated spending summaries — was a feature I had to work around, not one I asked for.
                what I needed was a tracker that stored expenses which has a name, a short description, and an amount. That's the it. 
              </Text>
              <Text style={styles.subText}>
                This app shows a running list and a few totals. That's the whole point. I kept wanting to use an app that has nothing else to get in the way to do its intended use.
                Eventually a few friends asked to use it too, which is the only reason it became something other than a personal tool.
              </Text>
              
              

            </View>
          </View>
      </ScrollView>
    </Background>
  )
}

const styles = StyleSheet.create({
  container : {
    paddingTop: '25%',
    maxWidth: 300,
    display: 'flex',
    flex: 1, 
    alignItems: "center",
    alignContent: 'center',
    alignSelf: 'center' 
  },
  textContainer:{
    gap: 10,
    width:'100%',
    alignContent: 'center',
    justifyContent: 'center',
    display: 'flex',
    color: 'white',
  },
  header:{
    alignSelf: 'center',
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 25,
  },
  subText:{
    fontSize: 12,
    marginVertical: 10,
    fontFamily: 'VCR-Mono',
    includeFontPadding: true,
    color: 'white',
    lineHeight: 18,
  }
   
})

export default About