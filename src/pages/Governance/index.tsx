import React, { useMemo } from 'react'
import { BodyWrapper } from '../AppBody'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { useGovernanceToken, useUserVotes, useUserDelegatee, useActiveProtocol } from '../../state/governance/hooks'
import Dropdown from '../../components/governance/Dropdown'
import { useToggleModal } from '../../state/application/hooks'
import useENS from '../../hooks/useENS'
import { useActiveWeb3React, useTheme } from '../../hooks'
import { ApplicationModal } from '../../state/application/actions'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TokenAmount, Token, ChainId, JSBI } from '@uniswap/sdk'
import { ZERO_ADDRESS, BIG_INT_ZERO } from '../../constants'
import { GreyCard } from '../../components/Card'
import { RowBetween, RowFixed } from '../../components/Row'
import { TYPE, ExternalLink } from '../../theme'
import { ButtonBasic, ButtonGray, ButtonBlue } from '../../components/Button'
import { shortenAddress, getEtherscanLink } from '../../utils'
import { Settings } from 'react-feather'
import TwitterAccountDetails from '../../components/twitter/TwitterAccountDetails'
import Loader from '../../components/Loader'
import QuestionHelper from '../../components/QuestionHelper'
import { useAllTransactions, isTransactionRecent } from '../../state/transactions/hooks'
import { newTransactionsFirst } from '../../components/Web3Status'
import { LoadingFlag } from '../../theme/components'

const SectionWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1.5em;
  margin-bottom: 1rem;
`
const EmptyCircle = styled.div`
  height: 48px;
  width: 48px;
  background: ${({ theme }) => theme.bg3};
  border-radius: 50%;
  margin-right: 1rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
`};
`

const AccountCard = styled(GreyCard)`
  padding-top: 56px;
  margin-top: -48px;
`

const StyledSettings = styled(Settings)`
  stroke: ${({ theme }) => theme.text3};
  height: 18px;
  width: 18px;

  :hover {
    cursor: pointer;
    stroke: ${({ theme }) => theme.text2};
  }
`

const UpdateButton = styled(ButtonGray)`
  font-size: 12px;
  width: fit-content;
  padding: 4px;
`

const ResponsiveRow = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    justify-content: flex-start;
  `};
`

const MobilePadding = styled.div`
  padding: 0;
  display: flex;
  width: 100%;
  justify-content: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-top: 1rem;
    justify-content: flex-start;
  `};
`

const MobileColumn = styled(AutoColumn)`
  justify-items: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-items: flex-start;
  `};
`

const FixedWidthAtSmall = styled(AutoColumn)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 160px;
  `};
`

const ButtonText = styled(TYPE.white)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

export default function Overview() {
  const theme = useTheme()

  // account details
  const { chainId, account } = useActiveWeb3React()
  const [activeProtocol] = useActiveProtocol()
  const { name: ensName } = useENS(account)

  // UI views
  const toggleWalletModal = useToggleModal(ApplicationModal.WALLET)
  const toggelDelegateModal = useToggleModal(ApplicationModal.DELEGATE)

  const govToken: Token | undefined = useGovernanceToken()

  // user gov data
  const availableVotes: TokenAmount | undefined = useUserVotes()
  const govTokenBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, govToken)
  const userDelegatee: string | undefined = useUserDelegatee()

  // if delegated to real address, show token balance + available, if not use available votes from contract
  const voteCount: TokenAmount | undefined =
    govTokenBalance && availableVotes
      ? userDelegatee && userDelegatee !== account
        ? govTokenBalance.add(availableVotes)
        : availableVotes
      : undefined

  // show pending txns if needed
  const allTransactions = useAllTransactions()
  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])
  const pending = sortedRecentTransactions.filter(tx => !tx.receipt).map(tx => tx.hash)
  const hasPendingTransactions = !!pending.length

  return (
    <BodyWrapper>
      <SectionWrapper>
        <AutoColumn gap="1rem">
          <Dropdown />
          <AccountCard>
            {!account ? (
              <RowBetween>
                <RowFixed>
                  <EmptyCircle />
                  <FixedWidthAtSmall gap="10px">
                    <TYPE.main fontSize="20px">Your Address</TYPE.main>
                    <TYPE.main fontSize="12px">Connect wallet to sign in or announce yourself as a delegate.</TYPE.main>
                  </FixedWidthAtSmall>
                </RowFixed>
                <ButtonBasic width="fit-content" onClick={toggleWalletModal}>
                  <ButtonText>Connect wallet</ButtonText>
                </ButtonBasic>
              </RowBetween>
            ) : (
              <ResponsiveRow>
                <AutoColumn gap="md">
                  {account && chainId && (
                    <RowFixed style={{ width: 'fit-content' }}>
                      <ExternalLink href={getEtherscanLink(chainId, account, 'address')}>
                        <TYPE.mediumHeader mr="10px" color={theme.text1}>
                          {ensName ?? shortenAddress(account)}
                        </TYPE.mediumHeader>
                      </ExternalLink>
                      <StyledSettings onClick={toggleWalletModal} stroke="black" />
                      {hasPendingTransactions && (
                        <LoadingFlag style={{ marginLeft: '10px' }} onClick={toggleWalletModal}>
                          {pending?.length} pending <Loader style={{ marginLeft: '4px', height: '12px' }} />
                        </LoadingFlag>
                      )}
                    </RowFixed>
                  )}
                  <TwitterAccountDetails />
                </AutoColumn>
                <MobilePadding>
                  <MobileColumn gap="md">
                    {!govTokenBalance && <Loader />}
                    {voteCount && chainId === ChainId.MAINNET && (
                      <RowFixed>
                        <TYPE.mediumHeader>{voteCount.toSignificant(3)} votes</TYPE.mediumHeader>
                        {JSBI.equal(BIG_INT_ZERO, voteCount.raw) && (
                          <QuestionHelper
                            text={`Hold ${activeProtocol?.token.symbol} to be be able to self-delegate or delegate to others.`}
                          />
                        )}
                      </RowFixed>
                    )}
                    {userDelegatee &&
                      (userDelegatee === ZERO_ADDRESS &&
                      govTokenBalance &&
                      JSBI.notEqual(BIG_INT_ZERO, govTokenBalance.raw) ? (
                        <ButtonBlue onClick={() => toggelDelegateModal()}>Delegate</ButtonBlue>
                      ) : (
                        <RowFixed height="38px" style={{ display: 'flex' }}>
                          {userDelegatee !== account && userDelegatee !== ZERO_ADDRESS ? (
                            <RowFixed>
                              <TYPE.main mr="4px">Delegated to: </TYPE.main>
                              <ExternalLink
                                style={{ margin: '0 6px' }}
                                href={getEtherscanLink(ChainId.MAINNET, userDelegatee, 'address')}
                              >
                                {shortenAddress(userDelegatee)}
                              </ExternalLink>
                            </RowFixed>
                          ) : (
                            userDelegatee === account && <TYPE.main mr="8px">Self delegated</TYPE.main>
                          )}
                          {govTokenBalance && JSBI.notEqual(BIG_INT_ZERO, govTokenBalance?.raw) && (
                            <UpdateButton onClick={() => toggelDelegateModal()}>Update</UpdateButton>
                          )}
                        </RowFixed>
                      ))}
                  </MobileColumn>
                </MobilePadding>
              </ResponsiveRow>
            )}
          </AccountCard>
        </AutoColumn>
      </SectionWrapper>
    </BodyWrapper>
  )
}
