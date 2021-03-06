import React, { useCallback, useRef, ChangeEvent } from 'react';
import {
  FiArrowLeft, FiMail, FiUser, FiLock, FiCamera,
} from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';
import { Link, useHistory } from 'react-router-dom';

import api from '../../services/api';

import { useToast } from '../../hooks/toast';

import getValidationErrors from '../../utils/getValidationErrors';

import logoImg from '../../assets/logo.svg';

import {
  Container, Content, AvatarInput,
} from './styles';

import Input from '../../components/input';
import Button from '../../components/button';
import { useAuth } from '../../hooks/auth';

interface ProfileFormData {
    name: string;
    email: string;
    old_password: string;
    password: string;
    password_confirmation: string;
}

const Profile: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { addToast } = useToast();
  const history = useHistory();

  const { user, updateUSer } = useAuth();

  const handleSubmit = useCallback(async (data: ProfileFormData) => {
    try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string().required('E-mail obrigatório').email('Digite um e-mail válido'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: (val) => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string().when('old_password', {
            is: (val) => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          }).oneOf([Yup.ref('password'), null], 'Confirmação incorreta'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const {
          name, email, old_password, password, password_confirmation,
        } = data;

        const formData = {
          name,
          email,
          ...(old_password ? {
            old_password,
            password,
            password_confirmation,
          } : {}),
        };

        const response = await api.put('/profile', formData);

        updateUSer(response.data);

        history.push('/dashboard');

        addToast({
          type: 'sucess',
          title: 'Perfil atualiado!',
          description: 'Suas informações do perfil foram atualizadas com sucesso.',
        });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors = getValidationErrors(err);

        formRef.current?.setErrors(errors);

        return;
      }

      addToast({
        type: 'info',
        title: 'Erro na atualização do perfil',
        description: 'Ocorreu um erro ao atualizar o seu perfil. Tente novamente.',
      });
    }
  }, [addToast, history, updateUSer]);

  const handleAvatarChance = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const data = new FormData();

      data.append('avatar', e.target.files[0]);

      api.patch('/users/avatar', data).then((response) => {
        updateUSer(response.data);
        addToast({
          type: 'sucess',
          title: 'Avatar atualizado!',
        });
      });
    }
  }, [addToast, updateUSer]);

  return (
    <Container>
      <header>
        <div>
          <Link to="dashboard">
            <FiArrowLeft />
          </Link>
        </div>
      </header>
      <Content>
        <Form
          ref={formRef}
          initialData={{
            name: user.name,
            email: user.email,
          }}
          onSubmit={handleSubmit}
        >
          <AvatarInput>
            <img src={user.avatar_url} alt={user.name} />
            <label htmlFor="avatar">
              <FiCamera />

              <input type="file" id="avatar" onChange={handleAvatarChance} />
            </label>

          </AvatarInput>

          <h1>Meu perfil</h1>

          <Input containerStyle={{ marginTop: 24 }} name="name" icon={FiUser} placeholder="Nome" />

          <Input name="email" icon={FiMail} placeholder="E-mail" />

          <Input name="old_password" icon={FiLock} type="password" placeholder="Senha atual" />

          <Input name="password" icon={FiLock} type="password" placeholder="Nova senha" />

          <Input name="password_confirmation" icon={FiLock} type="password" placeholder="Confirmar nova senha" />

          <Button type="submit">Salvar alterações</Button>

        </Form>
      </Content>
    </Container>
  );
};


export default Profile;
