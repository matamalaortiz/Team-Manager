import React, { Component } from "react";
import classes from "./Teams.module.css";
import axios from "axios";
import Team from "./Team";
import TeamCreator from "./TeamCreator";
import { storage, database } from "../firebase/firebase";

class Teams extends Component {
  state = {
    teams: [],
    newTeamName: null,
    newTeamLogo: null,
    selectedImage: null,
    uploadedImageUrl: "",
    previewFile: null,
    teamCreatorActive: false,
    pending: true,
  };

  componentDidMount() {
    this.getInitialTeamsList();
  }

  getInitialTeamsList = () => {
    const { userId } = this.props;
    axios.get(`/users/${userId}/teams.json`).then(({ data: teams }) => {
      if (teams) {
        const teamsList = Object.values(teams);
        this.setState({ teams: teamsList });
      }
      this.setState({ pending: false });
    });
  };

  handleFormSubmitEditTeam = (teamId, updatedTeamName, updatedImage, e) => {
    e.preventDefault();

    if (updatedTeamName && updatedImage) {
      this.handleTeamNameUpdate(teamId, updatedTeamName);
      this.handleTeamLogoUpdate(teamId, updatedImage);
    }
    if (updatedTeamName && !updatedImage) {
      this.handleTeamNameUpdate(teamId, updatedTeamName);
    }
    if (!updatedTeamName && updatedImage) {
      this.handleTeamLogoUpdate(teamId, updatedImage);
    }

    this.updateTeamsArrayOnEdit(teamId, updatedTeamName, updatedImage);
  };

  handleFormSubmitNewTeam = (newTeamName, selectedImage, e) => {
    e.preventDefault();
    const { userId } = this.props;
    const databsseRef = database.ref(`/users/${userId}/teams`);
    const teamId = databsseRef.push().key;
    const newTeam = { teamName: newTeamName, teamId: teamId, teamLogo: "" };
    databsseRef.child(teamId).set(newTeam);

    selectedImage
      ? this.handleImageUpload(teamId, selectedImage).then(() => {
        this.getUploadedImageUrl(teamId).then(() => {
          this.assignUploadedImageUrl(teamId);
          this.updateTeamsOnAdd({
            ...newTeam,
            teamLogo: this.state.uploadedImageUrl,
          });
        });
      })
      : this.updateTeamsOnAdd(newTeam);
  };

  handleImageUpload = async (teamId, selectedImage) => {
    const { userId } = this.props;
    await storage
      .ref(`users/${userId}/images/teams/${teamId}/team-logo/${teamId}`)
      .put(selectedImage);
  };

  getUploadedImageUrl = async (teamId) => {
    const { userId } = this.props;
    await storage
      .ref(`users/${userId}/images/teams/${teamId}/team-logo/${teamId}`)
      .getDownloadURL()
      .then((url) => {
        this.setState({ uploadedImageUrl: url });
      });
  };

  assignUploadedImageUrl = (teamId) => {
    const { userId } = this.props;
    database
      .ref(`/users/${userId}/teams/${teamId}`)
      .update({ teamLogo: this.state.uploadedImageUrl });
  };

  handleTeamNameUpdate = (teamId, updatedTeamName) => {
    const { userId } = this.props;
    database
      .ref(`/users/${userId}/teams/${teamId}`)
      .update({ teamName: updatedTeamName });
  };

  handleTeamLogoUpdate = (teamId, updatedImage) => {
    this.handleImageUpload(teamId, updatedImage).then(() => {
      this.getUploadedImageUrl(teamId).then(() => {
        this.assignUploadedImageUrl(teamId);
      });
    });
  };

  updateTeamsOnAdd = (newTeam) => {
    const updatedTeamsArray = [...this.state.teams, newTeam];
    this.setState({ teams: updatedTeamsArray });
  };

  updateTeamsArrayOnEdit = (teamId, updatedTeamName, updatedImage) => {
    const teamsArray = [...this.state.teams];
    let updatedTeam = teamsArray.find((team) => {
      return team.teamId === teamId;
    });
    const updatedImageUrl = updatedImage
      ? URL.createObjectURL(updatedImage)
      : null;

    if (updatedTeamName && updatedImage) {
      updatedTeam = {
        ...updatedTeam,
        teamName: updatedTeamName,
        teamLogo: updatedImageUrl,
      };
    }
    if (!updatedTeamName && updatedImage) {
      updatedTeam = { ...updatedTeam, teamLogo: updatedImageUrl };
    }
    if (updatedTeamName && !updatedImage) {
      updatedTeam = { ...updatedTeam, teamName: updatedTeamName };
    }

    const updatedTeamIndex = teamsArray.findIndex((team) => {
      return team.teamId === teamId;
    });
    teamsArray.splice(updatedTeamIndex, 1, updatedTeam);

    this.setState({ teams: teamsArray });
  };

  updateTeamsOnDelete = () => {
    const { userId } = this.props;
    const teamsDatabaseRef = database.ref(`users/${userId}/teams`);
    teamsDatabaseRef.once("value", (snapshot) => {
      const snapshotValue = snapshot.val();
      const teams = snapshotValue ? Object.values(snapshotValue) : [];
      this.setState({ teams });
    });
  };

  handleTeamDelete = (teamId, teamLogo) => {
    const { userId } = this.props;
    database.ref(`users/${userId}/teams/${teamId}`).remove();
    if (teamLogo) {
      storage
        .ref(`users/${userId}/images/teams/${teamId}/team-logo/${teamId}`)
        .delete();
    }
    this.updateTeamsOnDelete();
  };

  render() {
    if (this.state.pending) {
      return <div className={classes.Teams__Loader}></div>;
    }

    const userTeams =
      this.state.teams.length > 0 ? (
        <>
          {this.state.teams.map((team) => {
            return (
              <Team
                key={team.teamId}
                teamId={team.teamId}
                teamName={team.teamName}
                teamLogo={team.teamLogo}
                onDelete={this.handleTeamDelete}
                onSubmit={this.handleFormSubmitEditTeam}
              />
            );
          })}
        </>
      ) : (
          <h3 className={classes.Teams__NoTeamsMsg}>
            You have not created any teams yet!
          </h3>
        );

    return (
      <>
        {userTeams}
        <TeamCreator onSubmit={this.handleFormSubmitNewTeam} />
      </>
    );
  }
}

export default Teams;