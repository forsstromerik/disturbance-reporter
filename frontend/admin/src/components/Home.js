import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';
import ListView from './Listview';
import MapComponent from './MapComponent';
import RaisedButton from 'material-ui/RaisedButton';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import io from 'socket.io-client';
import H4SLogo from '../images/h4s.png';

class Home extends Component {
  constructor(props) {
      super(props);
      this.state = {
        incidents : [],
        suggestions : [],
        groups : [],
        police_events : [],
        lat: 59.329323,
        lon : 18.068581,
        current_active_id : "",
        show_incidents : "block",
        show_groups : "block",
        show_police : "block",
        newIDs: []
      }
  }
  
  toggle_incidents = () => {
    if (this.state.show_incidents === "block")
        this.setState({
          show_incidents : "none"
        });
    else {
        this.setState({
          show_incidents : "block"
        });
    }
  }

  convert_to_bool = (string) => {
    if (string === 'block') {
      return true 
    } else {
      return false 
    }
    console.log(string);
  }

  toggle_groups = () => {
    if (this.state.show_groups === "block")
        this.setState({
          show_groups: "none"
        });
    else {
        this.setState({
          show_groups: "block"
        });
    }
  }

  toggle_police = () => {
    if (this.state.show_police === "block")
        this.setState({
          show_police : "none"
        });
    else {
        this.setState({
          show_police : "block"
        });
    }
  }

  coordinate_callback = (coordinates, id) => {
    console.log(coordinates, id);
    //lat lon
    this.setState({
      lat: coordinates[0],
      lon: coordinates[1],
      current_active_id : id
    });
  }

  fetch_incidents() {
    fetch('http://localhost:3000/disturbances', {
      method: 'GET'
    })
      .then(function (res) {
        return res.json()
      })
      .then(function (json) {
        this.setState({
          incidents : json
        })
        this.fetch_suggestions();
      }.bind(this))
      .catch((error) => {
        console.log(error);
      });
  }

  fetch_suggestions() {
    fetch('http://localhost:3000/groups/suggestions', {
      method: 'GET',
      headers: {'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                },
      })
      .then(function (res) {
          return res.json()
      })
      .then(function (json) {
          this.setState({
            suggestions : json
          })
          this.map_incident_to_suggestion(); 
        }.bind(this))
        .catch((error) => {
          console.log(error);
      });
  }

  //Fetch police information
  fetch_police() {
    console.log("Fetching police!");
      var url = new URL("http://localhost:3000/police/events"),
          params = {lat: 59.3454488, lon: 18.0603384 , radius : 10 }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    fetch(url, {
      method: 'GET'
      })
      .then(function (res) {
          return res.json()
      })
      .then(function (json) {
          console.log(json);
          this.setState({
            police_events : json
          })
        }.bind(this))
        .catch((error) => {
          console.log(error);
      });
  }

  //Fetch all grouped events
  fetch_groups() {
    console.log("Fetching groups!");
    var url = "http://localhost:3000/groups"
    fetch(url, {
      method: 'GET'
      })
      .then(function (res) {
          return res.json()
      })
      .then(function (json) {
          this.setState({
              groups : json
          })
          console.log(this.state.groups)
        }.bind(this))
        .catch((error) => {
          console.log(error);
      });
  }

  //Iterate over incidents, see if they belong to any suggestion
  map_incident_to_suggestion() {
    var incidents = this.state.incidents;
    for (var i = 0; i < incidents.length; i++) {
      var current_id = incidents[i]._id;
      var belonging_suggestions = [];
      //For every incident, look which groups it's in
      var suggestions = this.state.suggestions;
      for (var j = 0; j < suggestions.length; j++) {
        var incident_ids = suggestions[i];
        if (suggestions[j].indexOf(current_id) !== 0) {
          belonging_suggestions.push(j);
          incidents[i].belonging_suggestions= belonging_suggestions;
        }
      }
    }
    this.setState({
      incidents : incidents
    })
  }

  componentDidMount() {
    this.fetch_incidents(); 
    this.fetch_police();
    this.fetch_groups();

    const socket = io('http://localhost:3333');
    socket.on('connect', () => {
      console.log('socket.connect()');
    });

    socket.on('newDisturbance', data => {
      let arr = this.state.newIDs;
      arr.push(data.newDisturbanceID);
      this.setState({
        incidents : data.disturbances,
        newIDs: arr
      })
    });

    socket.on('updatedDisturbance', data => {
      console.log(data);
      this.setState({
          incidents : data.disturbances
      })
    });
  }

  render() {
    return (
      <Grid fluid style={{ maxHeight: '700px', padding: 0}}> <Row>
          <Col className="sidebar" xs={3} style={{ maxHeight: '700px', overflow: 'scroll', paddingRight: 0 }}>
          <Row style={{paddingTop: "10px", paddingLeft: '10px'}}>
            <Col md={4}>
                <RaisedButton 
                  label="Incidents" 
                  secondary={this.convert_to_bool(this.state.show_incidents)}
                  onClick={this.toggle_incidents}
                />
            </Col>
            <Col md={4}>
                <RaisedButton 
                  label="Groups" 
                  secondary={this.convert_to_bool(this.state.show_groups)}
                  onClick={this.toggle_groups}
            />
            </Col>
            <Col>
                <RaisedButton 
                  label="Police" 
                  secondary={this.convert_to_bool(this.state.show_police)}
                  onClick={this.toggle_police}
                />
            </Col>
          </Row>
            <ListView
              display_incidents={this.state.show_incidents}
              display_groups={this.state.show_groups}
              display_police={this.state.show_police}
              callback={this.coordinate_callback}
              police_incidents={this.state.police_events}
              group_incidents={this.state.groups}
              newIDs={this.state.newIDs}
              removeNewID={(id) => {
                let array = this.state.newIDs;
                let index = array.indexOf(id);
                array.splice(index, 1);
                this.setState({ newIDs: array });
              }}
              incident_list={this.state.incidents} />
          </Col>
          <Col xs={9} style={{ overflowX: 'hidden', paddingLeft: 0 }}>
            <MapComponent 
                show_incidents={this.state.show_incidents}
                show_groups={this.state.show_groups}
                show_police={this.state.show_police}
                lon_prop={this.state.lon}
                lat_prop={this.state.lat}
                incident_list={this.state.incidents}
                police_incidents={this.state.police_events}
                group_incidents={this.state.groups}
                suggestion_list={this.state.suggestions}
                current_active_id={this.state.current_active_id}
            />
          </Col>
        </Row>

        <div className="footer">
          <img style={{ margin: '0 auto', width: '75px' }} src={H4SLogo} />           
          <p>Created with &hearts; by team Praise Networks @ Hack 4 Sweden 2018</p>
        </div>
      </Grid>
    );
  }
}

export default Home;
