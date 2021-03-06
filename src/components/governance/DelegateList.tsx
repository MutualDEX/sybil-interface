import React, { useState, useMemo } from 'react'
import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { TYPE, BlankInternalLink, OnlyAboveSmall, OnlyAboveLarge } from '../../theme'
import Row, { AutoRow } from '../Row'
import EmptyProfile from '../../assets/images/emptyprofile.png'
import { shortenAddress, isAddress } from '../../utils'
import { DelegateData, useActiveProtocol, useGlobalData, useGovernanceToken } from '../../state/governance/hooks'
import { WrappedListLogo, RoundedProfileImage, DelegateButton } from './styled'
import { GreyCard } from '../Card'
import { useActiveWeb3React } from '../../hooks'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/actions'
import DelegateModal from '../vote/DelegateModal'
import { Percent, JSBI } from '@uniswap/sdk'
import Loader from '../Loader'
import { BIG_INT_ZERO } from '../../constants'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useAllPrioritizedNames } from '../../state/social/hooks'

const ColumnLabel = styled(TYPE.darkGray)`
  white-space: no-wrap;
`

const NoWrap = styled(TYPE.black)`
  white-space: no-wrap;
`

const FixedAddressSize = styled(AutoColumn)`
  width: 140px;
`

const DataRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 140px 100px 160px;
  grid-column-gap: 1rem;
  padding: 0 2rem;

  margin: 6px 0;
  border-left: 3px solid transparent;

  :hover {
    border-left: 3px solid ${({ theme }) => theme.primary1};
  }

  &:first-child {
    :hover {
      border-left: 3px solid transparent;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToExtraLarge`
    grid-template-columns: 1fr 160px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 1fr 160px;
    margin: 0;
    padding: 0 1.5rem;
  `};
`

const AccountLinkGroup = styled(AutoRow)`
  :hover {
    opacity: 0.5;
    border-radius: 8px;
  }
`

const VoteText = styled(NoWrap)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

export default function DelegateList({ topDelegates }: { topDelegates: DelegateData[] | undefined }) {
  const { chainId, account } = useActiveWeb3React()

  // toggle for showing delegation modal with prefilled delegate
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE)
  const toggelDelegateModal = useToggleModal(ApplicationModal.DELEGATE)
  const [prefilledDelegate, setPrefilledDelegate] = useState<string | undefined>()

  // used to calculate % ownership of votes
  const [activeProtocol] = useActiveProtocol()

  // get global data to calculate vote %
  const globalData = useGlobalData()

  const govToken = useGovernanceToken()
  const govTokenBalance = useTokenBalance(account ?? undefined, govToken)

  // show delegate button if they have available votes or if theyve delegated to someone else
  const showDelegateButton = Boolean(govTokenBalance && JSBI.greaterThan(govTokenBalance.raw, BIG_INT_ZERO))

  // show indentity if it exists instead of address
  const names = useAllPrioritizedNames()

  const delegateList = useMemo(() => {
    return chainId && topDelegates && activeProtocol
      ? topDelegates.map((d, i) => {
          const formattedAddress = isAddress(d.id)
          return (
            <DataRow key={d.id}>
              <AutoRow gap="10px">
                <OnlyAboveSmall>
                  <NoWrap>{i + 1}</NoWrap>
                </OnlyAboveSmall>
                <BlankInternalLink to={activeProtocol?.id + '/' + d.id}>
                  <AccountLinkGroup gap="10px" width="initial">
                    <OnlyAboveSmall>
                      {d.imageURL ? (
                        <RoundedProfileImage>
                          <img src={d.imageURL} alt="profile" />
                        </RoundedProfileImage>
                      ) : (
                        <WrappedListLogo src={EmptyProfile} />
                      )}
                    </OnlyAboveSmall>
                    <FixedAddressSize gap="6px">
                      <TYPE.black>{(formattedAddress && names?.[formattedAddress]) ?? shortenAddress(d.id)}</TYPE.black>
                      {d.handle ? (
                        <TYPE.black fontSize="12px">{shortenAddress(d.id)}</TYPE.black>
                      ) : (
                        <TYPE.black fontSize="12px">{d.EOA ? '👤 EOA' : ' 📜 Smart Contract'}</TYPE.black>
                      )}
                    </FixedAddressSize>
                  </AccountLinkGroup>
                </BlankInternalLink>
                <DelegateButton
                  width="fit-content"
                  disabled={!showDelegateButton}
                  onClick={() => {
                    setPrefilledDelegate(d.id)
                    toggelDelegateModal()
                  }}
                >
                  Delegate
                </DelegateButton>
              </AutoRow>
              <OnlyAboveLarge>
                <NoWrap textAlign="end">{d.votes.length}</NoWrap>
              </OnlyAboveLarge>
              <OnlyAboveLarge>
                <NoWrap textAlign="end">
                  {globalData
                    ? new Percent(JSBI.BigInt(d.delegatedVotesRaw), JSBI.BigInt(globalData.delegatedVotesRaw)).toFixed(
                        3
                      ) + '%'
                    : '-'}
                </NoWrap>
              </OnlyAboveLarge>
              <VoteText textAlign="end">
                {parseFloat(parseFloat(d.delegatedVotes.toString()).toFixed(0)).toLocaleString()} Votes
              </VoteText>
            </DataRow>
          )
        })
      : null
  }, [activeProtocol, chainId, globalData, names, showDelegateButton, toggelDelegateModal, topDelegates])

  return (
    <GreyCard padding="2rem 0">
      <DelegateModal
        isOpen={showDelegateModal}
        onDismiss={() => {
          setPrefilledDelegate(undefined)
          toggelDelegateModal()
        }}
        title="Delegate Votes"
        prefilledDelegate={prefilledDelegate}
      />
      <AutoColumn gap="lg">
        <DataRow>
          <ColumnLabel>Rank</ColumnLabel>
          <OnlyAboveLarge>
            <ColumnLabel textAlign="end">Proposals Voted</ColumnLabel>
          </OnlyAboveLarge>
          <OnlyAboveLarge>
            <ColumnLabel textAlign="end">Vote Weight</ColumnLabel>
          </OnlyAboveLarge>
          <ColumnLabel textAlign="end">Total Votes</ColumnLabel>
        </DataRow>
        {delegateList ?? (
          <Row justify="center">
            <Loader />
          </Row>
        )}
      </AutoColumn>
    </GreyCard>
  )
}
