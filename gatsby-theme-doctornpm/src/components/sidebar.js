import {BorderBox, Flex, Position} from '@primer/components'
import React from 'react'
import {HEADER_HEIGHT} from './header'
import NavItems from './nav-items'

function Sidebar({navItems, repositoryUrl, location, editOnGitHub}) {
  return (
    <Position
      position="sticky"
      top={HEADER_HEIGHT}
      height={`calc(100vh - ${HEADER_HEIGHT}px)`}
      minWidth={260}
      color="gray.8"
      bg="gray.0"
    >
      <BorderBox
        borderWidth={0}
        borderRightWidth={1}
        borderRadius={0}
        height="100%"
        style={{overflow: 'auto'}}
      >
        <Flex flexDirection="column">
          <NavItems location={location} items={navItems} editOnGitHub={editOnGitHub} repositoryUrl={repositoryUrl} />
        </Flex>
      </BorderBox>
    </Position>
  )
}

export default Sidebar
