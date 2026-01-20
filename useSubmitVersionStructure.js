// hooks/useSubmitVersionStructure.js
import React, { useMemo } from 'react';
import { Button, Checkbox, Box, Tooltip } from '@chakra-ui/react';
import { tokenDecoder } from '../utils/networkUtils';

export const useSubmitVersionStructure = ({
  // 必填：checkbox 相關
  currentVersion, setCurrentVersion,
  isDisplayDownload, setIsDisplayDownload,
 
  // 其他動作 handler
  downloadJSON,
  navigatePreview,
  navigateDataConflict,
  navigatePrefill,

  // 上下文 props
  isOnline = true,
  assignment = {},
  questionnaireDataTypeList = [],
  questionnaireDataStatusList = [],
  EnumerationModesList = [],

  // 可選：唯讀模式（QuickView 常用）
  readOnly = false,
} = {}) => {
  return useMemo(() => [
    {
        // header: 'Submit Version',
        header: '',
        inputType: 'custome',
        key: '',
        cell: (content) => (
            <Checkbox isChecked={currentVersion == content.Q_DATA_VER_NO} isDisabled={!isOnline || (assignment.ASGN_STS != 'PE' && assignment.ASGN_STS != 'EIP' && assignment.ASGN_STS != 'QSR')} onChange={(e) => {
                setCurrentVersion(content.Q_DATA_VER_NO);
            }} />
        ),
    },
    {
        header: isDisplayDownload ? 'Download' : '',
        inputType: isDisplayDownload ? 'custome' : 'none',
        key: '',
        cell: (content) => (
            <Button
                variant={'blue'}
                onClick={() => downloadJSON(content)}
            >
                Download JSON
            </Button>
        ),
    },
    {
        header: 'Preview',
        inputType: 'custome',
        key: '',
        cell: (content) => {
            const submissionList = [assignment?.submission, assignment?.indoorSubmission, assignment?.followupSubmission, assignment?.fieldSubmission,];
            const target = submissionList.filter((item) => item?.length).flat().find((item) => assignment.TEMP_DOC_REF_NO == item.Form_ID && item.Version == content.Q_DATA_VER_NO);
            return (
                <Button
                    variant={'blue'}
                    onClick={() => navigatePreview(content)}
                    isDisabled={!isOnline && !target}
                >
                    Preview
                </Button>
            );
        },
    },
    {
        header: 'Review',
        inputType: 'custome',
        key: '',
        cell: (content) =>
            content.Q_DATA_TYP != "RAWA" && (content.RVW_STS == 'P' || content.RVW_STS == 'D' ) && [...(assignment.AssignmentDetailObject?.[0].OfficerList ?? []), ...(assignment.AssignmentDetailObject?.[0].SupervisorList ?? []),].some((item) => item.STF_POSN_UID == tokenDecoder().stf_position) && (
                <Button variant={'yellow'} onClick={() => navigateDataConflict(content)} >
                    Review
                </Button>
            ),
    },
    {
        header: 'Compare Pre-filled',
        inputType: 'custome',
        key: '',
        cell: (content) => {
            const submissionList = [assignment?.submission, assignment?.indoorSubmission, assignment?.followupSubmission, assignment?.fieldSubmission]
            const target = submissionList.filter(item => item?.length).flat().find(item => assignment.TEMP_DOC_REF_NO == item.Form_ID && item.Version == content.Q_DATA_VER_NO)
            return assignment?.lastRoundSubmission?.length > 0 && <Button
                        variant={'blue'}
                        onClick={() => navigatePrefill(content,true)}
                        isDisabled={!isOnline && !target}
                    >
                        Compare
                    </Button>
        },
    },
    {
      header: "Questionnaire Data Type",
      inputType: "text-select",
      key: "Q_DATA_TYP",
      contentKey: "Q_DATA_TYP",
      targetKey: "value",
      displayKey: "label",
      list: questionnaireDataTypeList,
    },
    {
      header: 'Data Conflict Status',
      inputType: 'text',
      key: 'DF_STS_DESCR',
    },
    {
      header: 'Complete/Partial',
      inputType: 'text-select',
      key: 'Q_DATA_STS',
      contentKey: 'Q_DATA_STS',
      targetKey: 'value',
      displayKey: 'label',
      list: questionnaireDataStatusList,
    },
    {
      header: 'Enum Mode',
      inputType: 'text-select',
      key: 'ENUM_MDE',
      contentKey: 'ENUM_MDE',
      targetKey: 'value',
      displayKey: 'label',
      list: EnumerationModesList.map(item => 
        item.value === "P" ? { ...item, label: null } : item
      ),
    },
    {
      header: 'Created By',
      inputType: 'text',
      key: 'CRE_BY',
    },
    {
      header: 'Create Time',
      inputType: 'text-date-time',
      key: 'CRE_DT',
    },
    {
      header: 'Review Status',
      inputType: 'text',
      key: 'RVW_STS_DESCR',
    },
    {
      header: 'Review By',
      inputType: 'text',
      key: 'RVW_BY_STF_NAME_ENG',
    },
    {
      header: 'Review Time',
      inputType: 'text-date',
      key: 'RVW_DT',
    },
    {
      header: 'Updated By',
      inputType: 'text',
      key: 'UPD_BY',
    },
    {
      header: 'Updated Time',
      inputType: 'text-date-time',
      key: 'UPD_DT',
    },
  ], [
    currentVersion,
    setCurrentVersion,
    setIsDisplayDownload,
    downloadJSON,
    navigatePreview,
    navigateDataConflict,
    isOnline,
    assignment,
    questionnaireDataTypeList,
    questionnaireDataStatusList,
    EnumerationModesList,
    readOnly,
  ]);
};