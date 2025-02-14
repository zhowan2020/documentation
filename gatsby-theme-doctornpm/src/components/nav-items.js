import {BorderBox, Box, Flex, StyledOcticon, Link, themeGet} from '@primer/components'
import {LinkExternalIcon} from '@primer/octicons-react'
import {Link as GatsbyLink} from 'gatsby'
import React from 'react'
import styled from 'styled-components'
import NavHierarchy from '../nav-hierarchy'



const getActiveProps = (className, baseProps) => (props) => {
  const location = NavHierarchy.getLocation(props.location.pathname);
  const href = NavHierarchy.getLocation(props.href);

  console.trace(baseProps)

  if (NavHierarchy.isActiveUrl(location, href, baseProps.items)) {
      return { className: `${className} active` };
  }

  return { className: `${className}` };
}

const ActiveLink = ({className, children, ...props}) => (
  <Link as={GatsbyLink} getProps={getActiveProps(className, props)} {...props}>
    {children}
  </Link>
)

const NavLink = styled(ActiveLink)`
  color: inherit;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`

const TopLevelLink = styled(NavLink)`
  &.active {
    font-weight: ${themeGet('fontWeights.bold')};
    color: ${themeGet('colors.gray.8')};
  }
  &.activePage {
    color: ${themeGet('colors.gray.8')};
  }
`
const SecondLevelLink = styled(NavLink)`
  display: block;
  font-size: ${themeGet('fontSizes.1')};
  padding-top: ${themeGet('space.1')};
  padding-bottom: ${themeGet('space.1')};
  margin-top: ${themeGet('space.2')};
  &.active {
    font-weight: ${themeGet('fontWeights.bold')};
    color: ${themeGet('colors.gray.8')};
  }
`

const ThirdLevelLink = styled(NavLink)`
  display: block;
  font-size: ${themeGet('fontSizes.1')};
  padding-top: ${themeGet('space.1')};
  padding-bottom: ${themeGet('space.1')};
  border-left: solid 1px ${themeGet('colors.gray.3')};
  padding-left: calc(${themeGet('space.2')} + (${themeGet('space.1')} - 1px));
  color: ${themeGet('colors.blue.5')};
  &.active {
    border-left: solid ${themeGet('space.1')} ${themeGet('colors.gray.3')};
    padding-left: ${themeGet('space.2')};
    color: ${themeGet('colors.gray.8')};
  }
`

const Description = styled(Box)`
  & {
    color: ${themeGet('colors.gray.6')};
    font-size: 0.8em;
    font-weight: normal;
  }
`

function topLevelItems(items, path, navItems) {
    if (items == null) {
        return null;
    }

    return (
      <>
        {items.map((item) => {
          const children = NavHierarchy.isActiveUrl(path, item.url, navItems) ? NavHierarchy.getHierarchy(item, { path: path, hideVariants: true }) : null;

          return (
            <BorderBox
              key={item.title}
              borderWidth={0}
              borderRadius={0}
              borderTopWidth={1}
              py={3}
              px={4}
            >
              <Flex flexDirection="column">
                <TopLevelLink to={item.url} key={item.title} items={navItems}>{item.title}</TopLevelLink>
                {secondLevelItems(children, path, navItems)}
              </Flex>
            </BorderBox>
          )
        })}
      </>
    );
}

function secondLevelItems(items, path, navItems) {
    if (items == null) {
        return null;
    }

    return (
      <Flex flexDirection="column" mt={2}>
        {items.map((item) => {
          const children = NavHierarchy.isActiveUrl(path, item.url, navItems) ? NavHierarchy.getHierarchy(item, { path: path, hideVariants: true }) : null;
          return(
            <Box key={item.title}>
              <SecondLevelLink key={item.url} to={item.url} items={navItems}>
                {item.title}
                {item.description != null ? (
                  <>
                    <Description>{item.description}</Description>
                  </>
                ) : null}
              </SecondLevelLink>
              {thirdLevelItems(children, path, navItems)}
            </Box>
          )
        })}
      </Flex>
    );
}

function thirdLevelItems(items, path, navItems) {
    if (items == null) {
        return null;
    }

    return (
      <Flex flexDirection="column" mt={2}>
        {items.map((item) => (
          <ThirdLevelLink key={item.url} to={item.url} items={navItems}>
            {item.title}
          </ThirdLevelLink>
        ))}
      </Flex>
    )
}

function githubLink(props) {
    if (!props.repositoryUrl) {
        return null;
    }

    return (
      <BorderBox borderWidth={0} borderTopWidth={1} borderRadius={0} py={5} px={4}>
        <Link href={props.repositoryUrl} color="inherit">
          <Flex justifyContent="space-between" alignItems="center" color="gray.5">
            Edit on GitHub
            <StyledOcticon icon={LinkExternalIcon} color="gray.5" />
          </Flex>
        </Link>
      </BorderBox>
    );
}

function NavItems(props) {
  const path = NavHierarchy.getLocation(props.location.pathname);
  const items = NavHierarchy.getHierarchy({ children: props.items }, { path: path, hideVariants: true }); 

  console.log(props)

  return (
    <>
      {topLevelItems(items, path, props.items)}
      {props.editOnGitHub !== false ? githubLink(props) : null}
    </>
  )
}

export default NavItems
