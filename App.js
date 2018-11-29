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
  Button, TextInput, Modal, Image, AsyncStorage,
  Linking
} from 'react-native';

import memoize from 'memoize-one'

import Swipeout from 'react-native-swipeout';


const PlayerNameCard = ({player}) => {

  const pesoStars = []

  for (i = 1; i <= (player.peso || 1); i++) {
    pesoStars.push("☆")
  }

  return <View style={{borderBottomWidth: 1, borderColor: "#d6d7da"}}>
    <View style={{paddingTop: 10, paddingBottom: 10, flexDirection: "row"}} >
      <Text style={{fontSize: 20, flex: 1}}>{player.name}</Text>
      <Text style={{fontSize: 20, marginRight: 5, marginLeft: 5}}>
        {pesoStars.join("")}
      </Text>
      {
        player.type == "goleiro" ? <Image
          style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
          source={require('./images/goleiro.png')} /> : <Image
          style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
          source={require('./images/chuteira.jpg')} />
      }
    </View>
  </View>
}


const PlayerCard = ({player, setPeso, hideTypeModal, showTypeModal, setFuncao, deletePlayer, toggleAbleToTeam}) => {

  const swipeBtns = [{
    text: 'Apagar',
    backgroundColor: 'red',
    underlayColor: 'rgba(0, 0, 0, 0.6)',
    onPress: deletePlayer
  }];

  const pesoStars = []

  for (i = 1; i <= (player.peso || 1); i++) {
    pesoStars.push("☆")
  }

  return <View style={{borderBottomWidth: 1, borderColor: "#d6d7da"}}>
    <Swipeout right={swipeBtns}
      autoClose={true}
      backgroundColor= 'transparent'>

      <TouchableWithoutFeedback onPress={toggleAbleToTeam}>
        <View style={{paddingTop: 10, paddingBottom: 10, flexDirection: "row"}} >
          {
            player.ableToTeam ? <Image
              style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
              source={require('./images/check.png')}
            /> : null
          }
          <Text style={{fontSize: 20, flex: 1}}>{player.name}</Text>
          <Text style={{fontSize: 20, marginRight: 5, marginLeft: 5}} onPress={showTypeModal}>
            {pesoStars.join("")}
          </Text>
          <TouchableWithoutFeedback onPress={showTypeModal}>
            {
              player.type == "goleiro" ? <Image
                style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
                source={require('./images/goleiro.png')} /> : <Image
                style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
                source={require('./images/chuteira.jpg')} />
            }
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

    </Swipeout>

    <Modal
      animationType="slide"
      transparent={false}
      visible={player.showTypeModal == true}
    >
      <View style={{flex: 1, justifyContent: "center"}}>
        <Text style={{textAlign: "center"}}>Escolher Função</Text>
        <Button style={{flex: 1, fontSize: 40}} title="1 estrela" onPress={() => setPeso(1)} />
        <Button style={{flex: 1, fontSize: 40}} title="2 estrelas" onPress={() => setPeso(2)} />
        <Button style={{flex: 1, fontSize: 40}} title="3 estrelas" onPress={() => setPeso(3)} />
        <Button style={{flex: 1, fontSize: 40}} title="Goleiro" onPress={() => setFuncao("goleiro")} />
        <Button style={{flex: 1, fontSize: 40}} title="Jogador" onPress={() => setFuncao("jogador")} />
        <View style={{ borderBottomWidth: 1, borderColor: "#d6d7da", marginTop: 10, marginBottom: 10 }} />
        <Button style={{flex: 1, fontSize: 20}} title="Fechar" onPress={() => hideTypeModal()} />
      </View>
    </Modal>
  </View>
}

const defaultState = {
  section: "players",
  inputPlayer: "",
  teams: [],
  players: [],
  settingsOpen: false,
  playersOnLine: 5,
}

type Props = {};

const getPesoForTeam = team => {
  return team.reduce(
    (memo, player) => {
      return memo + (player.peso || 1)
    }, 0
  )
}

const getAvailableTeams = (teams, linePlayersTotal, maxLinePlayersPerTeam) => {
  const lastTeamMaxCount = (linePlayersTotal % maxLinePlayersPerTeam) === 0 ? maxLinePlayersPerTeam : (linePlayersTotal % maxLinePlayersPerTeam)
  const teamsAux = [...teams]

  // + 1 por conta do goleiro
  if (teams[ teams.length -1 ].length >= lastTeamMaxCount + 1) {
    teamsAux.pop()
  }

  const menorPeso = teamsAux.map(getPesoForTeam).reduce((memo, item) => Math.min(memo, item))

  return teamsAux.filter(t => getPesoForTeam(t) == menorPeso)
}


export default class App extends Component<Props> {
  state = defaultState

  componentWillMount() {
    AsyncStorage.getItem("state").then(
      state => {
        if (state) {
          this.setState(JSON.parse(state))
        }
      }
    )
  }

  syncState = () => {
    if (this.state) {
      AsyncStorage.setItem("state", JSON.stringify(this.state))
    }
  }

  showTypeModal = player => {
    this.setPlayerVariable(player, "showTypeModal", true)
  }

  hideTypeModal = player => {
    this.setPlayerVariable(player, "showTypeModal", false)
  }

  toggleAbleToTeam = player => {
    this.setPlayerVariable(player, "ableToTeam", !player.ableToTeam, this.syncState)
  }

  deletePlayer = player => {
    const {
      players
    } = this.state

    this.setState({players: players.filter(p => p != player)}, this.syncState)
  }

  setPeso = (player, peso) => {
    this.setPlayerVariable(player, "peso", peso, player => {
      this.setPlayerVariable(player, "showTypeModal", false, this.syncState)
    })
  }

  setPlayerVariable = (player, variable, value, cb) => {
    const {
      players
    } = this.state

    const index = players.indexOf(player)

    if (index > -1) {
      const newPlayer = {...player, [variable]: value}
      const playersCopy = [...players]
      playersCopy.splice(index, 1, newPlayer)

      this.setState({players: playersCopy}, () => { cb && cb(newPlayer) })
    }
  }

  setFuncao = (player, value) => {
    this.setPlayerVariable(player, "type", value, player => {
      // n deveria fazer isso aqui, mas foda-se
      this.setPlayerVariable(player, "showTypeModal", false, this.syncState)
    })
  }

  setSection = sectionName => {
    this.setState({section: sectionName}, this.syncState)
  }

  onInputPlayerChange = inputPlayer => {
    this.setState({inputPlayer}, this.syncState)
  }

  generateTeams = () => {
    const {
      players,
      playersOnLine
    } = this.state

    const playersAvaiblable = players.filter(p => !!p.ableToTeam)
    const goalkeppers = playersAvaiblable.filter(p => p.type == "goleiro")
    const linePlayers = playersAvaiblable.filter(p => p.type != "goleiro")
    const maxLinePlayersPerTeam = /^\d+$/.test(playersOnLine) ? parseInt(playersOnLine) : 5

    const teansCount = Math.max(goalkeppers.length, Math.ceil(linePlayers.length / maxLinePlayersPerTeam))

    const teams = []

    for (let i = 0; i < teansCount ; i ++) {
      teams.push([])
    }

    goalkeppers.sort(() => 0.5 - Math.random()).forEach(
      (goalkepper, index) => teams[index].push(goalkepper)
    )


    linePlayers.sort(
      (a, b) => {
        const aPeso = a.peso || 1
        const bPeso = b.peso || 1

        if (aPeso == bPeso) {
          return 0.5 - Math.random()
        } else if (aPeso < bPeso) {
          return 1
        } else {
          return -1
        }
    }).forEach(
      (player, index) => {

        const availableTeams = getAvailableTeams(teams, linePlayers.length, maxLinePlayersPerTeam)

        availableTeams[ Math.floor(Math.random() * availableTeams.length) ].push(player)
      }
    )

    this.setState({teams: teams}, this.syncState)
  }

  openSettings = () => {
    this.setState({settingsOpen: true})
  }

  closeSettings = () => {
    this.setState({settingsOpen: false})
  }

  onPlayersOnLineChange = playersOnLine => {
    this.setState({playersOnLine}, this.syncState)
  }

  sortPlayers = memoize(
    players => players.sort((player1, player2) => {
      const player1NameFinal = player1.type == "goleiro" ? `1${player1.name}` : `2${player1.name}`
      const player2NameFinal = player2.type == "goleiro" ? `1${player2.name}` : `2${player2.name}`

      if (player1NameFinal > player2NameFinal) {
        return 1
      } else if (player1NameFinal < player2NameFinal) {
        return -1
      } else {
        return 0
      }
    })
  )

  addPlayer = name => {
    const {
      players
    } = this.state

    if (name != "" && players.map(p => p.name).indexOf(name) == -1) {
      this.setState({
        players: [...players, {name, type: "jogador", ableToTeam: true}],
        inputPlayer: ""
      }, this.syncState)
    }
  }

  render() {

    const {
      section,
      players,
      inputPlayer,
      teams,
      settingsOpen,
      playersOnLine
    } = this.state

    return (
      <SafeAreaView style={styles.container}>
        {
          section == "players" ? <Jogadores
            players={this.sortPlayers(players)}
            addPlayer={this.addPlayer}
            onInputPlayerChange={this.onInputPlayerChange}
            showTypeModal={this.showTypeModal}
            hideTypeModal={this.hideTypeModal}
            deletePlayer={this.deletePlayer}
            setPeso={this.setPeso}
            toggleAbleToTeam={this.toggleAbleToTeam}
            setFuncao={this.setFuncao}
            inputPlayer={inputPlayer}
          /> : null
        }
        {
          section == "teams" ? <Times
            generateTeams={this.generateTeams}
            openSettings={this.openSettings}
            teams={teams}
          /> : null
        }

        {
          section == "credits" ? <Credits /> : null
        }

        {
          settingsOpen ? <Settings
            closeSettings={this.closeSettings}
            onPlayersOnLineChange={this.onPlayersOnLineChange}
            playersOnLine={playersOnLine || 5}
          /> : null
        }

        <View style={{flexDirection: "row", paddingTop: 5, paddingBottom: 5, borderTopColor: "#d6d7da", borderTopWidth: 1}}>
            <TouchableWithoutFeedback onPress={() => this.setSection("players")}>
              <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                <Image
                  style={{width: 30, height: 30, marginRight: 5, marginTop: 2}}
                  resizeMode="contain"
                  source={require('./images/player.png')} />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={() => this.setSection("teams")}>
              <View style={{flex: 1, justifyContent: "center", alignItems: "center", borderColor: "#d6d7da", borderLeftWidth: 1}}>
                <Image
                  style={{width: 30, height: 30, marginRight: 5, marginTop: 2}}
                  resizeMode="contain"
                  source={require('./images/teams.png')} />
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={() => this.setSection("credits")}>
              <View style={{flex: 1, justifyContent: "center", alignItems: "center", borderColor: "#d6d7da", borderLeftWidth: 1}}>
                <Image
                  style={{width: 30, height: 30, marginRight: 5, marginTop: 2}}
                  resizeMode="contain"
                  source={require('./images/credits.png')} />
              </View>
            </TouchableWithoutFeedback>
        </View>
      </SafeAreaView>
    );
  }
}

const Credits = () => {
  return <View style={{flex: 1, paddingLeft: 10, paddingRight: 10, justifyContent: "center", alignItems: "center"}}>
    <Text>Feito com ♥ por Manoel Quirino Neto</Text>
    <Button title="Facebook" onPress={() => { Linking.openURL('https://www.facebook.com/manoelquirinoneto') }} />
  </View>
}

const Team = ({players, count}) => {
  return <View style={{ marginBottom: 80}}>
    <Text>Time {count}</Text>
    { players.map((player, i) => <PlayerNameCard key={player.name} player={player} />) }
  </View>
}

const Settings = ({closeSettings, onPlayersOnLineChange, playersOnLine}) => {
  return <Modal
      animationType="slide"
      transparent={false}
      visible={true}
    >
    <View style={{flex: 1, justifyContent: "center"}}>
      <Text style={{textAlign: "center", fontSize: 20, marginBottom: 20}}>Configurações</Text>
      <View style={{ flexDirection: "row", alignItems: "center"}}>
        <Text style={{width: 150, textAlign: "right", paddingRight: 10, fontSize: 15}}>Jogadores (linha): </Text>
        <TextInput keyboardType="numeric" onChangeText={onPlayersOnLineChange} value={playersOnLine} autoCorrect={false} style={{borderColor: "#d6d7da", borderWidth: 1, height: 30, width: 50, textAlign: "center"}}/>
      </View>
      <View style={{ borderBottomWidth: 1, borderColor: "#d6d7da", marginTop: 10, marginBottom: 10 }} />
      <Button title="Fechar" onPress={closeSettings} />
    </View>
  </Modal>
}

const Times = ({generateTeams, teams, openSettings}) => {

  return <ScrollView style={{flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 20}} >
    <View style={{ flexDirection: "row" }}>
      <View style={{flex: 1}}>
        <Button title="Gerar times" style={{fontSize: 30}} onPress={generateTeams} />
      </View>
      <View style={{flex: 1}}>
        <Button title="Configurações" style={{fontSize: 30}} onPress={openSettings} />
      </View>
    </View>
    { teams.map((players, i) => <Team key={i} players={players} count={i + 1} />) }
  </ScrollView>

}

const Jogadores = ({players, setPeso, addPlayer, inputPlayer, onInputPlayerChange, showTypeModal, hideTypeModal, setFuncao, deletePlayer, toggleAbleToTeam}) => {

  const selectedPlayersCount = players.filter(p => p.ableToTeam).length

  return <ScrollView style={{flex: 1, paddingLeft: 10, paddingRight: 10}}>
    <View style={{padding: 10, marginTop: 10, flexDirection: "row", backgroundColor: "white"}}>
      <TextInput onChangeText={onInputPlayerChange} value={inputPlayer} autoCorrect={false} placeholder="Nome do perna de pau" style={{flex: 1, borderColor: "#d6d7da", borderWidth: 1, paddingLeft: 10, paddingRight: 10, height: 40, marginBottom: 0}}/>
      <Button title="Add" onPress={() => addPlayer(inputPlayer)} />
    </View>

    <Text style={{flex: 1, textAlign: "center", marginTop: 10}}>{selectedPlayersCount} jogadores selecionados</Text>

    <View style={{padding: 10, backgroundColor: "white", flex: 1}}>
      {
        players.map(player => <PlayerCard
          key={player.name} player={player}
          showTypeModal={() => showTypeModal(player)}
          hideTypeModal={() => hideTypeModal(player)}
          deletePlayer={() => deletePlayer(player)}
          toggleAbleToTeam={() => toggleAbleToTeam(player)}
          setPeso={peso => setPeso(player, peso)}
          setFuncao={funcao => setFuncao(player, funcao)}
        />
        )
      }
    </View>
  </ScrollView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    // backgroundColor: "#ebf0f1",
  },
});
