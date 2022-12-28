import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Popup
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo, removeAttachment } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      if (this.state.newTodoName.length > 0) {
        const newTodo = await createTodo(this.props.auth.getIdToken(), {
          name: this.state.newTodoName,
          dueDate
        })
        this.state.todos?.push(newTodo)
        this.setState({
          //todos: [...this.state.todos, newTodo],
          todos: this.state.todos,
          newTodoName: ''
        })
      } else {
        alert('Task name can\'t be empty');
      }
    } catch(e) {
      alert(`Todo creation failed: ${e}`)
    }
  }


  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.id !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.id, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Update todo failed!')
    }
  }

  onRemoveAttachmentButtonClick = async (todo: Todo) => {
    try {
      const todoId = todo.id;
      if (todo.attachmentUrl) {
        //extract attachement s3 key
        const attachmentUrl = todo.attachmentUrl;
        const attachmentUrlParts = attachmentUrl.split("/");
        const length = attachmentUrlParts.length;
        const s3Key = `${attachmentUrlParts[length - 2]}/${
          attachmentUrlParts[length - 1]
        }`;
        await removeAttachment(this.props.auth.getIdToken(), todoId, s3Key);
        //
        let updatedTodos: Todo[] = [];
        this.state.todos.forEach(function (todo) {
          if (todo.id === todoId) {
            todo.attachmentUrl = "";
            updatedTodos.push(todo);
          } else {
            updatedTodos.push(todo);
          }
        });
        this.setState({
          todos: updatedTodos,
        });
      }
    } catch (error) {
      console.log("Failed to remove attachment..!");
    }
  };

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      console.log('get todo list: ',todos)
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>
        {this.renderCreateTodoInput()}
        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    console.log(`render todo list table, ${this.state.todos}`)
    return (
      <Grid padded>
        {this.state.todos?.map((todo, pos) => {
          return (
            <Grid.Row key={todo.id}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={2} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.id)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.id)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              <Grid.Column width={2}>
              {todo.attachmentUrl && (
                    <Popup
                      content="Remove attachment"
                      trigger={
                        <Button
                          icon
                          color="orange"
                          onClick={() =>
                            this.onRemoveAttachmentButtonClick(todo)
                          }
                        >
                          <Icon name="unlinkify" />
                        </Button>
                      }
                    />
                  )}
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}