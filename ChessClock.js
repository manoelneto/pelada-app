/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableWithoutFeedback, SafeAreaView,
  Button
} from 'react-native';


const UserTap = ({children, style = [], onPress}) => {
  return <View style={styles.touchableMargin}>
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.tap, ...style]}>
        <Text style={styles.tapText}>{children}</Text>
      </View>
    </TouchableWithoutFeedback>
  </View>
}

const time = 5

const defaultState = {
  button1Time: time,
  button2Time: time,
  currentButtonRunning: null,
}

type Props = {};

export default class App extends Component<Props> {
  state = defaultState

  getTime(time) {
    let seconds = Math.floor((time % 60)).toString()

    if (seconds.length === 1) {
      seconds = `0${seconds}`
    }

    return `${Math.floor(time / 60)}:${seconds}`
  }

  stop = () => {
    clearInterval(this.interval)
    this.interval = null
  }

  reset = () => {
    this.stop()
    this.setState(defaultState)
  }

  tick = () => {
    const {
      currentButtonRunning
    } = this.state

    if (currentButtonRunning) {

      const newTime = Math.max(this.state[`${currentButtonRunning}Time`] - 0.1, 0)

      this.setState({
        [`${currentButtonRunning}Time`]: newTime
      })

      if (newTime === 0) {
        this.stop()
      }
    }
  }

  startTimer = () => {
    if (!this.interval) {
      this.interval = setInterval(this.tick, 100)
    }
  }

  click = button => {
    const otherButton = button === "button1" ? "button2" : "button1"
    this.setState({currentButtonRunning: otherButton}, () => this.startTimer())
  }

  render() {
    const {
      button1Time,
      button2Time
    } = this.state

    return (
      <SafeAreaView style={styles.container}>
        <UserTap style={[styles.rotated]} onPress={() => this.click("button1")}>{this.getTime(button1Time)}</UserTap>
        <View style={[styles.buttons]}>
          <Button title="Reset" onPress={() => this.reset()}></Button>
        </View>
        <UserTap style={[styles.secondTap]} onPress={() => this.click("button2")}>{this.getTime(button2Time)}</UserTap>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  touchableMargin: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    flex: 1,
  },
  tap: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#0000FF',
    justifyContent: "center",
    alignItems: "center",
  },
  secondTap: {
    backgroundColor: '#00FF00',
  },
  rotated: {
    transform: [{rotate: "180deg"}],
  },
  buttons: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10
  },
  tapText: {
    fontSize: 40
  }
});
