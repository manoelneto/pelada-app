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
  Linking, Picker, ActivityIndicator
} from 'react-native';

import PickerSelect from 'react-native-picker-select'

import memoize from 'memoize-one'

import Swipeout from 'react-native-swipeout';


const PlayerNameCard = ({player}) => {

  const pesoStars = []

  for (i = 1; i <= parseInt(player.peso || 1); i++) {
    pesoStars.push("☆")
  }

  return <View style={{borderBottomWidth: 1, borderColor: "#d6d7da"}}>
    <View style={{paddingTop: 10, paddingBottom: 10, flexDirection: "row"}} >
      <Text style={{fontSize: 20, flex: 1}}>{player.name}</Text>
      <Text style={{fontSize: 20, marginRight: 5, marginLeft: 5}}>
        {pesoStars.join("")}
      </Text>
      {
        isGoleiro(player) ? <Image
          style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
          source={require('./images/goleiro.png')} /> : <Image
          style={{width: 20, height: 20, marginRight: 5, marginTop: 2}}
          source={require('./images/chuteira.jpg')} />
      }
    </View>
  </View>
}


const PlayerCard = ({player, setPlayerName, setPeso, hideTypeModal, showTypeModal, setFuncao, deletePlayer, toggleAbleToTeam}) => {

  const swipeBtns = [{
    text: 'Apagar',
    backgroundColor: 'red',
    underlayColor: 'rgba(0, 0, 0, 0.6)',
    onPress: deletePlayer
  }];


  const leftSwipeBtns = [{
    text: 'Alterar',
    backgroundColor: '#0b8af3',
    underlayColor: 'rgba(0, 0, 0, 0.6)',
    onPress: showTypeModal
  }];


  const pesoStars = []

  for (i = 1; i <= parseInt(player.peso || 1); i++) {
    pesoStars.push("☆")
  }

  return <View style={{borderBottomWidth: 1, borderColor: "#d6d7da"}}>
    <Swipeout
      right={swipeBtns}
      left={leftSwipeBtns}
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
              isGoleiro(player) ? <Image
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
      onRequestClose={() => console.log("onRequestClose")}
    >
      <SafeAreaView style={{flex: 1}}>
        <ScrollView>
          <Text style={styles.modalTitle}>{player.name}</Text>

          <View style={styles.inputGroup}>
            <Text style={{marginBottom: 5}}>Estrelas</Text>
            <PickerSelect
              placeholder={{}}
              items={[{
                label: "☆",
                value: "1"
              }, {
                label: "☆☆",
                value: "2"
              }, {
                label: "☆☆☆",
                value: "3"
              }, {
                label: "☆☆☆☆",
                value: "4"
              }, {
                label: "☆☆☆☆☆",
                value: "5"
              }]}
              style={{inputIOS: styles.picker}}
              onValueChange={setPeso}
              value={player.peso ? player.peso.toString() : ""}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={{marginBottom: 5}}>Tipo</Text>
            <PickerSelect
              placeholder={{}}
              items={[{
                label: "Goleiro",
                value: "goleiro"
              }, {
                label: "Jogador",
                value: "jogador"
              }]}
              style={{inputIOS: styles.picker}}
              onValueChange={setFuncao}
              value={player.type ? player.type : "jogador"}
            />
          </View>

          <View style={styles.separator} />
          <Button style={{flex: 1, fontSize: 20}} title="Fechar" onPress={() => hideTypeModal()} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>
}

const defaultState = {
  section: "help",
  inputPlayer: "",
  teams: [],
  players: [],
  settingsOpen: false,
  playersOnLine: 5,
}

type Props = {};

const getPesoForTeam = team => {
  let teamsAux = [...team]

  // se n tiver goleiro, assume que tem 1 de peso 1
  const hasGoleiro = team.filter(isGoleiro).length > 0

  if (! hasGoleiro) {
    teamsAux.unshift({peso: 1})
  }

  return teamsAux.reduce(
    (memo, player) => {
      return memo + parseInt(player.peso || 1)
    }, 0
  )
}

const isNotGoleiro = player => player.type != 'goleiro'
const isGoleiro = player => player.type == 'goleiro'

const getAvailableTeams = (teams, linePlayersTotal, maxLinePlayersPerTeam) => {
  const lastTeamMaxCount = (linePlayersTotal % maxLinePlayersPerTeam) === 0 ? maxLinePlayersPerTeam : (linePlayersTotal % maxLinePlayersPerTeam)
  let teamsAux = [...teams]

  // + 1 por conta do goleiro
  const lastTeamLinePlayersCount = teams[ teams.length -1 ].filter(isNotGoleiro).length
  if (lastTeamLinePlayersCount >= lastTeamMaxCount) {
    teamsAux.pop()
  }

  // remove os times que ja tem todos os jogadores na linha
  teamsAux = teamsAux.filter(players => {
    return players.filter(isNotGoleiro).length < maxLinePlayersPerTeam
  })

  const menorPeso = teamsAux.map(
    getPesoForTeam).reduce((memo, item) => Math.min(memo, item))

  return teamsAux.filter(t => getPesoForTeam(t) == menorPeso)
}


export default class App extends Component<Props> {
  state = defaultState

  componentWillMount() {
    AsyncStorage.getItem("state").then(
      state => {
        if (state) {
          this.setState({
            ... JSON.parse(state),
            loaded: true
          })
        } else {
          this.setState({loaded: true})
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
    this.setPlayerVariable(player, "peso", peso ? parseInt(peso) : peso, this.syncState)
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
    this.setPlayerVariable(player, "type", value, this.syncState)
  }

  setPlayerName = (player, value) => {
    this.setPlayerVariable(player, "name", value, this.syncState)
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
    const goalkeppers = playersAvaiblable.filter(isGoleiro)
    const linePlayers = playersAvaiblable.filter(isNotGoleiro)
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
        const aPeso = parseInt(a.peso || 1)
        const bPeso = parseInt(b.peso || 1)

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
      const player1NameFinal = isGoleiro(player1) ? `1${player1.name}` : `2${player1.name}`
      const player2NameFinal = isGoleiro(player2) ? `1${player2.name}` : `2${player2.name}`

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
        players: [...players, {name, type: "jogador", ableToTeam: true, peso: 2}],
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
      playersOnLine,
      loaded
    } = this.state

    if (! loaded) {
      return <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
        <ActivityIndicator size="large" />
      </View>
    }

    return (
      <SafeAreaView style={styles.container}>
        {
          section == "players" ? <Jogadores
            players={this.sortPlayers(players)}
            addPlayer={this.addPlayer}
            onInputPlayerChange={this.onInputPlayerChange}
            setPlayerName={this.setPlayerName}
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
          section == "help" || section == "credits" ? <Help /> : null
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

            <TouchableWithoutFeedback onPress={() => this.setSection("help")}>
              <View style={{flex: 1, justifyContent: "center", alignItems: "center", borderColor: "#d6d7da", borderLeftWidth: 1}}>
                <Image
                  style={{width: 30, height: 30, marginRight: 5, marginTop: 2}}
                  resizeMode="contain"
                  source={require('./images/help.png')} />
              </View>
            </TouchableWithoutFeedback>
        </View>
      </SafeAreaView>
    );
  }
}

const Help = () => {
  return <SafeAreaView style={{flex: 1}}>
    <ScrollView>
      <View style={{paddingLeft: 10, paddingRight: 10, paddingTop: 40}}>
        <View style={{justifyContent: "center", alignItems: "center"}}>
          <Text style={{marginBottom: 10, fontSize: 15}}>Feito com ♥ por Manoel Quirino Neto</Text>
          <Button title="Facebook" onPress={() => { Linking.openURL('https://www.facebook.com/manoelquirinoneto') }} />
        </View>
        <Text style={{marginTop: 20,}}>
          Os jogadores são adicionados na tela inicial; {"\n"}{"\n"}

          Os times são distribuidos aleatoriamente conforme as estrelas; {"\n"}{"\n"}

          Arraste para direia, clique nas estrelas ou no ícone goleiro/chuteira para alterar atributos dos jogadores; {"\n"}{"\n"}

          Arraste para a esquerda para excluir o jogador; {"\n"}{"\n"}

          Não pode haver mais de um jogador com o mesmo nome, para isso, coloque "Manoel 1" e "Manoel 2"; {"\n"}{"\n"}

          Clique no jogador para habilita-lo e desabilita-lo (ícone de check verde) para o sorteio; {"\n"}{"\n"}

          É possível alterar a quantidade de jogadores na linha na tela do sorteio.
        </Text>

        <Text style={{textAlign: "center", marginTop: 20}}>
          BOA PELADA
        </Text>
      </View>
    </ScrollView>
  </SafeAreaView>
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
      onRequestClose={() => console.log("onRequestClose")}
    >
    <SafeAreaView style={{flex: 1}}>
      <ScrollView>
        <Text style={styles.modalTitle}>Configurações</Text>

        <View style={styles.inputGroup}>
          <Text style={{marginBottom: 5}}>Jogadores na linha</Text>
          <PickerSelect
            placeholder={{}}
            items={[{
              label: "1",
              value: "1"
            },{
              label: "2",
              value: "2"
            },{
              label: "3",
              value: "3"
            },{
              label: "4",
              value: "4"
            },{
              label: "5",
              value: "5"
            },{
              label: "6",
              value: "6"
            },{
              label: "7",
              value: "7"
            },{
              label: "8",
              value: "8"
            },{
              label: "9",
              value: "9"
            },{
              label: "10",
              value: "10"
            },]}
            style={{inputIOS: styles.picker}}
            onValueChange={onPlayersOnLineChange}
            value={playersOnLine}
          />
        </View>

        <Button title="Fechar" onPress={closeSettings} />
      </ScrollView>
    </SafeAreaView>
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

const Jogadores = ({players, setPlayerName, setPeso, addPlayer, inputPlayer, onInputPlayerChange, showTypeModal, hideTypeModal, setFuncao, deletePlayer, toggleAbleToTeam}) => {

  const selectedPlayersCount = players.filter(p => p.ableToTeam).length

  return <ScrollView style={{flex: 1, paddingLeft: 10, paddingRight: 10}}>
    <View style={{padding: 10, marginTop: 10, flexDirection: "row"}}>
      <TextInput onChangeText={onInputPlayerChange} value={inputPlayer} autoCorrect={false} placeholder="Adicionar jogador" style={{flex: 1, borderColor: "#d6d7da", borderWidth: 1, paddingLeft: 10, paddingRight: 10, height: 40, marginBottom: 0}}/>
      <Button title="Add" onPress={() => addPlayer(inputPlayer)} />
    </View>

    <Text style={{flex: 1, textAlign: "center", marginTop: 10}}>{selectedPlayersCount} jogadores selecionados</Text>

    <View style={{padding: 10, flex: 1}}>
      {
        players.map(player => <PlayerCard
          key={player.name} player={player}
          showTypeModal={() => showTypeModal(player)}
          hideTypeModal={() => hideTypeModal(player)}
          deletePlayer={() => deletePlayer(player)}
          toggleAbleToTeam={() => toggleAbleToTeam(player)}
          setPeso={peso => setPeso(player, peso)}
          setFuncao={funcao => setFuncao(player, funcao)}
          setPlayerName={name => setPlayerName(player, name)}
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
  },

  modalTitle: {
    textAlign: "center", fontSize: 20, marginBottom: 20
  },

  separator: {
    marginTop: 10, marginBottom: 10
  },

  inputGroup: {
    paddingLeft: 10, paddingRight: 10, marginBottom: 10,
  },

  input: {
    borderColor: "#d6d7da", borderBottomWidth: 1,
    paddingTop: 5, paddingBottom: 5,
  },

  picker: {
    fontSize: 16,
    paddingTop: 13,
    paddingHorizontal: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    backgroundColor: 'white',
    color: 'black',
  },

});
