import {
  $,
  type NoSerialize,
  type Signal,
  component$,
  createContextId,
  noSerialize,
  useContextProvider,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from '@builder.io/qwik-city';
import { RouterHead } from '~/components/router-head/router-head';

import './global.scss';
import {
  answerToCall,
  callToUser,
  destroyPeer,
  initailizePeer,
} from '~/utils/peer';
import type Peer from 'peerjs';
import { initializeSocket } from './utils/socket';
import { type Socket } from 'socket.io-client';

interface IPeerContext {
  isInitialized: boolean;
  peer?: NoSerialize<Peer>;

  call?: ReturnType<typeof callToUser>;
  answer?: ReturnType<typeof answerToCall>;

  destroy?: ReturnType<typeof destroyPeer>;
}

interface ISocketContext {
  isInitialized: boolean;
  socket?: NoSerialize<Socket>;
}

export const PeerContext = createContextId<Signal<IPeerContext>>('peer');
export const SocketContext = createContextId<Signal<ISocketContext>>('socket');

export default component$(() => {
  const peerSignal = useSignal<IPeerContext>({
    isInitialized: false,
    peer: undefined,
    call: undefined,
    answer: undefined,
  });

  const socketSignal = useSignal<ISocketContext>({
    isInitialized: false,
    socket: undefined,
  });

  useContextProvider(PeerContext, peerSignal);
  useContextProvider(SocketContext, socketSignal);

  const onSocketInit = $((socket: Socket) => {
    if (!socket.connected) return;
    socketSignal.value = {
      isInitialized: true,
      socket: noSerialize(socket),
    };
    console.log(socket, 'initialized');
  });

  const onPeerInit = $((peer: Peer) => {
    const nonSerializedPeer = noSerialize(peer);
    peerSignal.value = {
      isInitialized: true,
      peer: nonSerializedPeer,
      call: callToUser(nonSerializedPeer),
      answer: answerToCall(nonSerializedPeer),
      destroy: destroyPeer(nonSerializedPeer),
    };

    peer.on('error', (error: any) => {
      if (error.type === 'peer-unavailable') {
        console.error('--------> ', error.type);
      }
    });
  });

  useVisibleTask$(async () => {
    initializeSocket(onSocketInit);
    initailizePeer(onPeerInit);
  });

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>Video Chat</title>

        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        ></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap"
          rel="stylesheet"
        ></link>
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
